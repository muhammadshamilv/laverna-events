# Backend setup (PowerShell)

Run these commands from the `backend` folder:

```powershell
Set-Location "backend"
& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py check
python manage.py runserver
```

Open `http://127.0.0.1:8000/api/health/` to verify the API. The Django admin is available at `http://127.0.0.1:8000/admin/`.

If PowerShell blocks activation for this session, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
& .\.venv\Scripts\Activate.ps1
```

Create an administrator with `python manage.py createsuperuser` when needed.