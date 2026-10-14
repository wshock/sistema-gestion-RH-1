# Seguimiento 4 — EAD y análisis de clusters

- [`ead_clusters_rrhh.ipynb`](./ead_clusters_rrhh.ipynb): versión principal, resumida y explicada en lenguaje sencillo.
- [`ead_clusters_rrhh_completo.ipynb`](./ead_clusters_rrhh_completo.ipynb): versión extendida, con pruebas estadísticas, más métricas de clustering, PCA y clustering jerárquico.

Ambos analizan las 8 tablas de AdventureWorks que usa el SGRH (`humanresources.*` y `person.person` / `person.businessentity`): calidad de los datos, exploración de la plantilla y segmentación de empleados en perfiles con K-Means.

## Cómo ejecutarlo

Requiere Python 3.11+ y el archivo `.env` de la raíz del proyecto con un `DATABASE_URL` válido (el mismo que usa la app). El notebook solo hace consultas `SELECT` dentro de una transacción de solo lectura.

```bash
# desde la raíz del repositorio
python -m venv analisis/.venv
analisis\.venv\Scripts\activate          # Windows
# source analisis/.venv/bin/activate     # macOS / Linux
pip install -r analisis/requirements.txt
jupyter notebook analisis/ead_clusters_rrhh.ipynb
```

Luego: *Kernel → Restart & Run All*.
