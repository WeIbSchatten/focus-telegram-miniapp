import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.settings import settings
from app.models.meditation import Meditation
from app.schemas.meditation import MeditationRead, MeditationCreate, MeditationUpdate
from app.core.security import get_current_user
from app.dependencies.auth import require_admin_or_moderator
from app.services.audio_compress import compress_audio_to_mp3

router = APIRouter(prefix="/meditations", tags=["meditations"])

ALLOWED_AUDIO = (".mp3", ".m4a", ".webm", ".ogg", ".wav")
MAX_SIZE = getattr(settings, "MAX_AUDIO_FILE_SIZE", 5 * 1024 * 1024)


def _meditations_dir() -> Path:
    d = settings.upload_path / "meditations"
    d.mkdir(parents=True, exist_ok=True)
    return d


@router.get("/", response_model=list[MeditationRead])
@router.get("", response_model=list[MeditationRead])
def list_meditations(
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    return db.query(Meditation).order_by(Meditation.order, Meditation.id).all()


@router.get("/{meditation_id}/audio")
def get_meditation_audio(
    meditation_id: int,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    meditation = db.query(Meditation).filter(Meditation.id == meditation_id).first()
    if not meditation:
        raise HTTPException(status_code=404, detail="Медитация не найдена")
    path = settings.upload_path / meditation.file_path
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Файл не найден")
    return FileResponse(
        path,
        media_type="audio/mpeg",
        filename=os.path.basename(meditation.file_path),
    )


@router.post("/", response_model=MeditationRead, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=MeditationRead, status_code=status.HTTP_201_CREATED)
async def create_meditation(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _user=Depends(require_admin_or_moderator),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_AUDIO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Разрешены форматы: {', '.join(ALLOWED_AUDIO)}",
        )
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Размер файла не должен превышать {MAX_SIZE // (1024*1024)} МБ",
        )
    meditations_dir = _meditations_dir()
    safe_name = f"{uuid.uuid4().hex}{ext}"
    out_path = meditations_dir / safe_name
    out_path.write_bytes(content)
    relative_path = f"meditations/{safe_name}"
    file_size = len(content)

    result = compress_audio_to_mp3(out_path)
    if result is not None:
        compressed_path, compressed_size = result
        out_path.unlink(missing_ok=True)
        relative_path = f"meditations/{compressed_path.name}"
        file_size = compressed_size

    meditation = Meditation(
        title=title.strip() or file.filename or "Медитация",
        file_path=relative_path,
        file_size=file_size,
        order=0,
    )
    db.add(meditation)
    db.commit()
    db.refresh(meditation)
    return meditation


@router.patch("/{meditation_id}", response_model=MeditationRead)
def update_meditation(
    meditation_id: int,
    payload: MeditationUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin_or_moderator),
):
    meditation = db.query(Meditation).filter(Meditation.id == meditation_id).first()
    if not meditation:
        raise HTTPException(status_code=404, detail="Медитация не найдена")
    if payload.title is not None:
        meditation.title = payload.title
    if payload.order is not None:
        meditation.order = payload.order
    db.commit()
    db.refresh(meditation)
    return meditation


@router.delete("/{meditation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meditation(
    meditation_id: int,
    db: Session = Depends(get_db),
    _user=Depends(require_admin_or_moderator),
):
    meditation = db.query(Meditation).filter(Meditation.id == meditation_id).first()
    if not meditation:
        raise HTTPException(status_code=404, detail="Медитация не найдена")
    path = settings.upload_path / meditation.file_path
    if path.is_file():
        path.unlink(missing_ok=True)
    db.delete(meditation)
    db.commit()
