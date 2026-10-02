"""Start the Next.js website and Flask prediction service together.

Run: .venv/bin/python run_site.py
Use --production after running npm run build in frontend/.
"""
import argparse
from pathlib import Path
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--production', action='store_true')
    args = parser.parse_args()
    node = shutil.which('node')
    next_cli = ROOT / 'frontend/node_modules/next/dist/bin/next'
    if not node or not next_cli.exists():
        parser.error('Install Node.js and run npm install in frontend/ first.')
    processes = []
    try:
        processes.append(subprocess.Popen([sys.executable, 'app.py'], cwd=ROOT))
        processes.append(subprocess.Popen([node, str(next_cli), 'start' if args.production else 'dev', '--hostname', '127.0.0.1'], cwd=ROOT / 'frontend'))
        print('\nStayWise website: http://127.0.0.1:3000\nPress Ctrl+C to stop both servers.\n', flush=True)
        while all(process.poll() is None for process in processes):
            time.sleep(.5)
        failed = next(process.returncode for process in processes if process.poll() is not None)
        if failed:
            print('A service could not start. Check its error above (including ports 3000/5000).', file=sys.stderr)
        return failed or 0
    except KeyboardInterrupt:
        return 0
    finally:
        for process in processes:
            if process.poll() is None:
                process.terminate()
        for process in processes:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


if __name__ == '__main__':
    sys.exit(main())
