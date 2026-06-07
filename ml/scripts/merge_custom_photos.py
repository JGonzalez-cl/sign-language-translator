# ml/scripts/merge_custom_photos.py
from pathlib import Path
import shutil

ML_DIR = Path(__file__).resolve().parent.parent
TEMP_DIR = ML_DIR / "data" / "temp"
TRAIN_DIR = ML_DIR / "data" / "raw" / "train"

gestos = [d.name for d in TEMP_DIR.iterdir() if d.is_dir()]
print(f"Gestos encontrados en temp/: {sorted(gestos)}")

total = 0
for gesto in gestos:
    src = TEMP_DIR / gesto
    dst = TRAIN_DIR / gesto
    
    if not dst.exists():
        print(f"  AVISO: {gesto} no existe en raw/train/ — saltando")
        continue
    
    fotos = list(src.glob("*.jpg")) + list(src.glob("*.jpeg")) + list(src.glob("*.png"))
    for foto in fotos:
        shutil.copy2(foto, dst / foto.name)
    
    print(f"  {gesto}: {len(fotos)} fotos copiadas → raw/train/{gesto}/")
    total += len(fotos)

print(f"\nTotal copiadas: {total}")