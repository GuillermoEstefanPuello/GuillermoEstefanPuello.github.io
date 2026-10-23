"""Actualiza el contador de contribuciones de GitHub en index.html.

Lee el mismo número que muestra el perfil público de GitHub
("N contributions in the last year"). Si la página no responde, intenta
la API GraphQL con el GITHUB_TOKEN del workflow. Si todo falla, no toca
nada: el número anterior se queda en la página.
"""
import datetime
import json
import os
import re
import sys
import urllib.request

USER = "GuillermoEstefanPuello"
HTML = "index.html"
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def desde_perfil():
    req = urllib.request.Request(
        f"https://github.com/users/{USER}/contributions",
        headers={"User-Agent": "Mozilla/5.0 (portfolio-contribs-updater)"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        page = r.read().decode("utf-8", "replace")
    m = re.search(r"([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year", page, re.I)
    return int(m.group(1).replace(",", "")) if m else None


def desde_api():
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        return None
    query = ('query{user(login:"%s"){contributionsCollection{'
             'contributionCalendar{totalContributions}}}}' % USER)
    req = urllib.request.Request(
        "https://api.github.com/graphql",
        data=json.dumps({"query": query}).encode(),
        headers={"Authorization": f"bearer {token}",
                 "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    return data["data"]["user"]["contributionsCollection"][
        "contributionCalendar"]["totalContributions"]


def main():
    total = None
    for fuente in (desde_perfil, desde_api):
        try:
            total = fuente()
        except Exception as e:  # noqa: BLE001
            print(f"{fuente.__name__} falló: {e}")
        if total:
            print(f"{fuente.__name__}: {total}")
            break

    if not total:
        print("Sin dato confiable; se deja el número anterior.")
        return 0

    rd = datetime.datetime.utcnow() - datetime.timedelta(hours=4)  # hora de RD
    fecha = f"{rd.day} de {MESES[rd.month - 1]} de {rd.year}"

    with open(HTML, encoding="utf-8") as f:
        html = f.read()
    nuevo = re.sub(r"(<[^>]*\bdata-contribs(?![-\w])[^>]*>)[\d,.]+(<)",
                   rf"\g<1>{total:,}\g<2>", html)
    nuevo = re.sub(r"(<[^>]*\bdata-contribs-date\b[^>]*>)[^<]*(<)",
                   rf"\g<1>{fecha}\g<2>", nuevo)

    if nuevo == html:
        print("Sin cambios.")
        return 0
    with open(HTML, "w", encoding="utf-8") as f:
        f.write(nuevo)
    print(f"index.html actualizado: {total} contribuciones, corte {fecha}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
