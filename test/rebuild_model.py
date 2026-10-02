"""Rebuild the deployment artifact by executing the original notebook code.

Run with .venv/bin/python -u rebuild_model.py after installing
requirements.txt and requirements-training.txt. Full CV/tuning can take minutes.
The notebook and its recorded outputs are preserved.
"""
import json
import os
from pathlib import Path
import shutil
import tempfile

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)
os.environ.setdefault('MPLBACKEND', 'Agg')


def main():
    import matplotlib.pyplot as plt

    notebook = json.loads((ROOT / 'Model/new.ipynb').read_text())
    target = ROOT / 'Model/best_hotel_cancellation_model.joblib'
    # Write and verify a separate artifact before replacing the existing file.
    pending = target.with_name('rebuilt_hotel_cancellation_model.joblib')
    namespace = {'__name__': '__main__', 'display': lambda value: print(value)}
    for number, cell in enumerate(notebook['cells'], 1):
        if cell['cell_type'] != 'code':
            continue
        source = ''.join(cell['source'])
        source = source.replace(
            "Path('best_hotel_cancellation_model.joblib')", f'Path({str(pending)!r})'
        )
        print(f'\nExecuting notebook cell {number}', flush=True)
        exec(compile(source, f'new.ipynb:cell-{number}', 'exec'), namespace)
        plt.close('all')
    if target.exists():
        backup_dir = Path(tempfile.mkdtemp(prefix='staywise-original-model-'))
        shutil.copy2(target, backup_dir / target.name)
        print(f'Previous artifact backed up to {backup_dir}', flush=True)
    pending.replace(target)
    print(f'Rebuilt and verified model installed at {target}', flush=True)


if __name__ == '__main__':
    main()
