import re
from dataclasses import dataclass, field


def single_line(value: str) -> str:
    """Line breaks in a header would let a sender add their own headers."""
    return re.sub(r"[\r\n]+", " ", value).strip()


@dataclass
class EmailMessage:
    to: str
    subject: str
    html_body: str
    text_body: str | None = None
    headers: dict[str, str] = field(default_factory=dict)
