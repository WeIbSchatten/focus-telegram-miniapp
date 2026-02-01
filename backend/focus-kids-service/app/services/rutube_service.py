"""
Сервис для работы с RuTube: формирование embed URL и HTML для встраивания видео.
Документация: https://rutube.ru/info/embed/
"""

RUTUBE_EMBED_BASE = "https://rutube.ru/play/embed"
RUTUBE_VIDEO_BASE = "https://rutube.ru/video"


def get_embed_url(video_id: str, *, width: int = 720, height: int = 405, **params: str) -> str:
  """
  Возвращает URL для iframe src.
  video_id — ID видео на RuTube (например из ссылки https://rutube.ru/video/VIDEO_ID/).
  params: t (старт в сек), skinColor (HEX без #), stopTime и т.д.
  """
  if not video_id or not video_id.strip():
    return ""
  video_id = video_id.strip()
  url = f"{RUTUBE_EMBED_BASE}/{video_id}"
  if params:
    q = "&".join(f"{k}={v}" for k, v in params.items() if v is not None)
    if q:
      url = f"{url}?{q}"
  return url


def get_embed_html(
  video_id: str,
  *,
  width: int = 720,
  height: int = 405,
  **params: str,
) -> str:
  """Возвращает готовый HTML iframe для вставки на страницу."""
  src = get_embed_url(video_id, width=width, height=height, **params)
  if not src:
    return ""
  return (
    f'<iframe width="{width}" height="{height}" src="{src}" '
    'frameBorder="0" allow="clipboard-write; autoplay; fullscreen" '
    'webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>'
  )
