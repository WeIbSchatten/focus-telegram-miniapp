"""
Сжатие аудио через ffmpeg: конвертация в mp3 128 kbps для экономии места.
Если ffmpeg недоступен или конвертация не удалась — возвращаем None (используем исходный файл).
"""
import logging
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)

BITRATE = "128k"
OUTPUT_EXT = ".mp3"


def compress_audio_to_mp3(input_path: Path) -> tuple[Path, int] | None:
    """
    Конвертирует аудиофайл в mp3 128 kbps.
    Возвращает (путь_к_mp3, размер_в_байтах) или None при ошибке.
    Исходный файл не удаляется — это делает вызывающий код.
    """
    if not input_path.is_file():
        return None
    output_path = input_path.with_suffix(OUTPUT_EXT)
    if output_path == input_path:
        output_path = input_path.parent / f"{input_path.stem}_compressed{OUTPUT_EXT}"
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i", str(input_path),
                "-acodec", "libmp3lame",
                "-b:a", BITRATE,
                "-ac", "1",
                str(output_path),
            ],
            capture_output=True,
            timeout=120,
            check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired) as e:
        logger.warning("ffmpeg compress failed for %s: %s", input_path, e)
        return None
    if not output_path.is_file():
        return None
    size = output_path.stat().st_size
    return (output_path, size)
