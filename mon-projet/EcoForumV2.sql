-- Afficher un aperçu des mesures
SELECT 
    m.id_mesure,
    m.valeur_mesure,
    m.date_heure,
    i.nom_outil as instrument,
    vm.type_mesure,
    vm.unite_mesure
FROM mesure m
JOIN serie_temporelle st ON st.id_st = m.id_st
JOIN variable_mesuree vm ON vm.id_variable_mesuree = st.id_variable_mesuree
JOIN capteur_generique cg ON cg.id_capteur_generique = st.id_capteur_gen
JOIN capteur c ON c.id_capteur = cg.id_capteur_generique
JOIN instrument_mesure i ON i.id_instrument = c.id_instrument
LIMIT 20;