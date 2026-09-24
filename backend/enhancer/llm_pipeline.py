import logging
import re
from typing import TypedDict

from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import Runnable, RunnableLambda
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint

from .config import settings
from .prompt import get_prompt
from logging import getLogger

logger = getLogger(__name__)

THINK_BLOCK = re.compile(r"<think>.*?</think>", flags=re.DOTALL)


class EnhancementError(Exception):
    """Raised when the model is unavailable or fails to enhance a description."""


class EnhancementResult(TypedDict):
    original: str
    enhanced: str

class PropertyListingEnhancer:

    def __init__(
        self,
        model_repo: str = settings.HF_THINKING_MODEL_REPO,
        provider: str = settings.HF_THINKING_MODEL_PROVIDER_NAME,
        temperature: float = 0.1,
    ):
        self.model_repo = model_repo
        self.provider = provider
        self.temperature = temperature
        self.llm: ChatHuggingFace | None = None
        self.chain: Runnable[dict[str, str], str] | None = None
        self._setup_model()

    @property
    def is_ai_available(self) -> bool:
        return self.chain is not None

    def _setup_model(self) -> None:
        """Set up the ChatHuggingFace model and chain, leaving them unset on failure."""
        try:
            logger.info("Initializing model %s via %s", self.model_repo, self.provider)
            endpoint = HuggingFaceEndpoint(
                repo_id=self.model_repo,
                provider=self.provider,
                temperature=self.temperature,
                max_new_tokens=settings.MAX_NEW_TOKENS,
                huggingfacehub_api_token=settings.HF_TOKEN,
            )
            self.llm = ChatHuggingFace(llm=endpoint)
            self.chain = (
                get_prompt("property_enhancer")
                | self.llm
                | StrOutputParser()
                | RunnableLambda(self.clean_response)
            )
            logger.info("Initialized model %s", self.model_repo)
        except Exception:
            logger.exception("Model setup failed")
            self.llm = None
            self.chain = None

    @staticmethod
    def clean_response(text: str) -> str:
        """Strip <think>...</think> reasoning blocks emitted by thinking models."""
        return THINK_BLOCK.sub("", text).strip()

    async def enhance_property_description(self, description: str) -> EnhancementResult:
        """Enhance one description with the model, raising EnhancementError on failure."""
        if self.chain is None:
            raise EnhancementError("AI model is not available")
        try:
            enhanced = await self.chain.ainvoke({"description": description})
        except Exception as exc:
            logger.exception("AI enhancement failed")
            raise EnhancementError("AI enhancement failed, please try again") from exc
        if not enhanced:
            raise EnhancementError("AI model returned an empty response")
        return {"original": description, "enhanced": enhanced}
