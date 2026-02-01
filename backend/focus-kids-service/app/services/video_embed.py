"""
Парсинг ссылок YouTube, VK Video, RuTube и формирование embed URL для встраивания.
"""
import re

VIDEO_TYPES = ("youtube", "vk", "rutube")


def parse_video_url(url: str) -> tuple[str | None, str | None]:
  """
  Парсит ссылку на видео. Возвращает (video_type, video_id) или (None, None).
  Поддерживает: youtube (watch, youtu.be), vk.com/video, rutube.ru/video.
  """
  if not url or not url.strip():
    return None, None
  url = url.strip()

  # YouTube: https://www.youtube.com/watch?v=VIDEO_ID или https://youtu.be/VIDEO_ID
  m = re.search(r"(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})", url)
  if m:
    return "youtube", m.group(1)

  # VK: https://vk.com/video123_456 или https://vk.com/video-123_456
  m = re.search(r"vk\.com/video(-?\d+)_(\d+)", url)
  if m:
    return "vk", f"{m.group(1)}_{m.group(2)}"

  # RuTube: https://rutube.ru/video/VIDEO_ID/ или https://rutube.ru/play/embed/VIDEO_ID
  m = re.search(r"rutube\.ru/(?:video/|play/embed/)([a-zA-Z0-9_-]+)", url)
  if m:
    return "rutube", m.group(1)

  return None, None


def get_embed_url(video_type: str, video_id: str, *, width: int = 720, height: int = 405) -> str | None:
  """Возвращает URL для iframe src по типу и id видео."""
  if not video_id or not video_id.strip():
    return None
  video_id = video_id.strip()
  if video_type == "youtube":
    return f"https://www.youtube.com/embed/{video_id}"
  if video_type == "vk":
    # VK embed: https://vk.com/video_ext.php?oid=OWNER&id=VIDEO&hd=2 (oid может быть отрицательным)
    parts = video_id.split("_")
    if len(parts) >= 2:
      oid, vid = parts[0].strip(), parts[1].strip()
      return f"https://vk.com/video_ext.php?oid={oid}&id={vid}&hd=2"
    return None
  if video_type == "rutube":
    from app.services.rutube_service import get_embed_url as rutube_embed
    return rutube_embed(video_id)
  return None


def get_watch_url(video_type: str, video_id: str) -> str | None:
  """Возвращает обычную ссылку на просмотр (если embed недоступен)."""
  if not video_id or not video_id.strip():
    return None
  video_id = video_id.strip()
  if video_type == "youtube":
    return f"https://www.youtube.com/watch?v={video_id}"
  if video_type == "vk":
    parts = video_id.split("_")
    if len(parts) >= 2:
      return f"https://vk.com/video{parts[0]}_{parts[1]}"
    return f"https://vk.com/video{video_id}"
  if video_type == "rutube":
    return f"https://rutube.ru/video/{video_id}/"
  return None
