UPDATE public."Capteur" 
SET "Id_instrument" = (SELECT "id_instrument" FROM public."instrument" WHERE "id_instrument" = '2345' LIMIT 1)
WHERE "nom" IN ('T400', 'Thermo2');