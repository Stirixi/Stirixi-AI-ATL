from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, Iterable, Optional

from bson import ObjectId
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.instruction import AccountMeta, Instruction
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solana.rpc.types import TxOpts
from solana.transaction import Transaction

from app.core.config import settings

logger = logging.getLogger(__name__)

EXCLUDED_ENGINEER_FIELDS = {
    "prompt_history",
    "monthly_performance",
    "recent_actions",
}
SBT_SCHEMA = {
    "id": "stirixi.sbt.engineer-score",
    "version": "2024-11-08",
}
MEMO_PROGRAM_ID = Pubkey.from_string("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")


@dataclass
class SolanaTransactionResult:
    signature: str
    score_hash: str


class SolanaSBTError(RuntimeError):
    """Raised when Solana related operations fail."""


class SolanaSBTService:
    """Utility service that anchors engineer score snapshots on Solana."""

    def __init__(self) -> None:
        self.rpc_url = settings.SOLANA_RPC_URL
        self.client: Optional[AsyncClient] = None
        self.authority = self._load_authority_keypair()
        self.sbt_mint = self._load_optional_pubkey(settings.SOLANA_SBT_MINT)

    async def _get_client(self) -> AsyncClient:
        if not self.client:
            self.client = AsyncClient(self.rpc_url, timeout=30)
        return self.client

    async def mint_soulbound_token(
        self, engineer_wallet: str, payload: Dict[str, Any]
    ) -> SolanaTransactionResult:
        """Hashes the payload and stores it on-chain through the memo program."""
        payload["issued_at"] = datetime.utcnow().isoformat()
        payload["issuer"] = str(self.authority.pubkey())
        serialized_payload = self._serialize(payload)
        payload_json = json.dumps(serialized_payload, sort_keys=True, separators=(",", ":"))
        score_hash = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()

        memo_ix = Instruction(
            program_id=MEMO_PROGRAM_ID,
            accounts=[
                AccountMeta(
                    pubkey=self.authority.pubkey(),
                    is_signer=True,
                    is_writable=False,
                )
            ],
            data=payload_json.encode("utf-8"),
        )

        transaction = Transaction().add(memo_ix)
        signature = await self._send_transaction(transaction)

        return SolanaTransactionResult(signature=signature, score_hash=score_hash)

    def build_soulbound_payload(
        self,
        engineer: Dict[str, Any],
        score: Dict[str, Any],
    ) -> Dict[str, Any]:
        profile = self._sanitize_engineer_profile(engineer)
        score_snapshot = self._sanitize_score_snapshot(score)

        payload = {
            "schema": SBT_SCHEMA,
            "engineer": profile,
            "score": score_snapshot,
            "token_program": "token-2022",
            "non_transferable": True,
        }

        if self.sbt_mint:
            payload["sbt_mint"] = str(self.sbt_mint)

        return payload

    async def close(self) -> None:
        if self.client:
            await self.client.close()
            self.client = None

    async def _send_transaction(self, transaction: Transaction) -> str:
        client = await self._get_client()
        opts = TxOpts(
            skip_preflight=False,
            preflight_commitment=Confirmed,
            max_retries=3,
        )

        response = await client.send_transaction(transaction, self.authority, opts=opts)
        signature = getattr(response, "value", None)
        if not signature:
            raise SolanaSBTError(f"Failed to send transaction: {response}")
        return signature

    def _load_optional_pubkey(self, value: Optional[str]) -> Optional[Pubkey]:
        if not value:
            return None
        try:
            return Pubkey.from_string(value)
        except Exception as exc:  # pylint: disable=broad-except
            logger.warning("Invalid SOLANA_SBT_MINT '%s': %s", value, exc)
            return None

    def _load_authority_keypair(self) -> Keypair:
        secret = self._load_keypair_data()
        if isinstance(secret, str):
            try:
                return Keypair.from_base58_string(secret)
            except Exception as exc:  # pylint: disable=broad-except
                raise SolanaSBTError("Invalid SOLANA_KEYPAIR_JSON value") from exc

        if isinstance(secret, Iterable):
            secret_list = list(secret)
            secret_bytes = bytes(secret_list)
            if len(secret_bytes) != 64:
                raise SolanaSBTError("Keypair secret must be 64 bytes long")
            return Keypair.from_bytes(secret_bytes)

        logger.warning("No Solana keypair configured. Using ephemeral keypair.")
        return Keypair()

    def _load_keypair_data(self) -> Optional[Any]:
        if settings.SOLANA_KEYPAIR_PATH:
            path = Path(settings.SOLANA_KEYPAIR_PATH).expanduser()
            if not path.exists():
                raise SolanaSBTError(f"SOLANA_KEYPAIR_PATH not found: {path}")
            return json.loads(path.read_text())

        if settings.SOLANA_KEYPAIR_JSON:
            try:
                return json.loads(settings.SOLANA_KEYPAIR_JSON)
            except json.JSONDecodeError:
                return settings.SOLANA_KEYPAIR_JSON

        return None

    def _sanitize_engineer_profile(self, engineer: Dict[str, Any]) -> Dict[str, Any]:
        profile: Dict[str, Any] = {}
        for key, value in engineer.items():
            if key in EXCLUDED_ENGINEER_FIELDS:
                continue
            field_name = "engineer_id" if key == "_id" else key
            profile[field_name] = self._serialize(value)
        profile["schema_version"] = SBT_SCHEMA["version"]
        return profile

    def _sanitize_score_snapshot(self, score: Dict[str, Any]) -> Dict[str, Any]:
        snapshot: Dict[str, Any] = {"schema_version": SBT_SCHEMA["version"]}
        for key, value in score.items():
            if key in {"score_hash", "solana_signature", "id", "_id"}:
                continue
            if key in {"engineer_id", "project_id"}:
                snapshot[key] = str(value) if value else None
                continue
            snapshot[key] = self._serialize(value)
        return snapshot

    def _serialize(self, value: Any) -> Any:
        if isinstance(value, dict):
            return {k: self._serialize(v) for k, v in value.items()}
        if isinstance(value, list):
            return [self._serialize(item) for item in value]
        if isinstance(value, tuple):
            return tuple(self._serialize(item) for item in value)
        if isinstance(value, (datetime, date)):
            return value.isoformat()
        if isinstance(value, ObjectId):
            return str(value)
        return value


solana_sbt_service = SolanaSBTService()
