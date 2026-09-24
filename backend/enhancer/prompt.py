import yaml
from langchain_core.prompts import ChatPromptTemplate
from pathlib import Path

PROMPT_FILE_PATH = Path(__file__).parent.parent / "config" / "prompt.yaml"

def load_prompts():
    with open(PROMPT_FILE_PATH, "r") as file:
        prompts_dict = yaml.safe_load(file)
    return prompts_dict

_PROMPTS = load_prompts()

def get_prompt(name: str) -> ChatPromptTemplate:
    if name not in _PROMPTS:
        raise KeyError(f"Prompt '{name}' not found in prompt.yaml")
    prompt = _PROMPTS[name]
    return ChatPromptTemplate.from_messages(
        [("system", prompt["system"]), ("human", prompt["human"])]
    )
