-- Habilita `unaccent` para las búsquedas insensibles a mayúsculas y acentos.
-- Sin esta extensión, buscar "investigacion" no encuentra "Investigación".
CREATE EXTENSION IF NOT EXISTS unaccent;
