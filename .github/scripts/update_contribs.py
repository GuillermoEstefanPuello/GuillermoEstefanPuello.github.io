"""Actualiza el contador de contribuciones de GitHub en index.html.

Lee el mismo número que muestra el perfil público de GitHub
("N contributions in the last year"), que incluye las contribuciones
privadas cuando el perfil las muestra. No usa la API con GITHUB_TOKEN
porque esa solo cuenta lo público.

Protecciones: si no logra leer el número, o si el número nuevo cae más de
un 30 % frente al actual (señal de lectura incompleta), no toca nada y el
número anterior se queda en la página.
"""
import datetime
import re
import sys
import urllib.request

USER = "GuillermoEstefanPuello"
HTML = "index.html"
CAIDA_MAXIMA = 0.30
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
RE_NUM = re.compile(r"(<[^>]*\bdata-contribs(?![-\w])[^>]*>)([\d,.]+)(<)")
RE_FECHA = re.compile(r"(<[^>]*\bdata-contribs-date\b[^>]*>)[^<]*(<)")


def aviso(msg):
    # Sale como anotación en la corrida de la Action (visible en la pestaña Actions).
    print(f"::warning::{msg}")


def leer_perfil():
    req = urllib.request.Request(
        f"https://github.com/users/{USER}/contributions",
        headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            "Accept": "text/html",
            "X-Requested-With": "XMLHttpRequest",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        page = r.read().decode("utf-8", "replace")

    texto = re.sub(r"<[^>]+>", " ", page)
    texto = re.sub(r"\s+", " ", texto)

    m = re.search(r"([\d,]+) contributions? in the last year", texto, re.I)
    if m:
        return int(m.group(1).replace(",", "")), "titulo"

    dias = re.findall(r"(\d+) contributions? on ", texto, re.I)
    if dias:
        return sum(int(d) for d in dias), f"suma de {len(dias)} dias"

    i = texto.lower().find("contribution")
    aviso(f"Formato no reconocido. len={len(page)} muestra={texto[max(0, i - 80):i + 120]!r}")
    return None, "sin match"


def main():
    with open(HTML, encoding="utf-8") as f:
        html = f.read()

    actual_m = RE_NUM.search(html)
    actual = int(re.sub(r"\D", "", actual_m.group(2))) if actual_m else 0

    try:
        total, como = leer_perfil()
    except Exception as e:  # noqa: BLE001
        aviso(f"No se pudo leer el perfil: {e}")
        return 0

    if not total:
        aviso("Sin dato confiable; se deja el número anterior.")
        return 0

    if actual and total < actual * (1 - CAIDA_MAXIMA):
        aviso(f"Lectura sospechosa: {total} ({como}) vs actual {actual}. No se actualiza.")
        return 0

    rd = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=4)
    fecha = f"{rd.day} de {MESES[rd.month - 1]} de {rd.year}"

    nuevo = RE_NUM.sub(lambda m: f"{m.group(1)}{total:,}{m.group(3)}", html)
    nuevo = RE_FECHA.sub(lambda m: f"{m.group(1)}{fecha}{m.group(2)}", nuevo)

    aviso(f"Leído {total} ({como}); actual {actual}.")
    if nuevo == html:
        return 0
    with open(HTML, "w", encoding="utf-8") as f:
        f.write(nuevo)
    print(f"index.html actualizado: {total} contribuciones, corte {fecha}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
