# Sauvegarde locale des données du garage

Le propriétaire doit pouvoir télécharger, à tout moment, une copie Excel lisible de
l'ensemble de ses données métier, afin de ne pas dépendre de la disponibilité de
l'application, de l'hébergement ou de la base.

Ce lot est un **export seul**. Il ne crée pas de mode hors ligne, pas de
synchronisation, pas de réimport. La restauration éventuelle fera l'objet d'un lot
distinct, et le fichier ne prétend pas être réinjectable.

Le lot remplace au passage un mécanisme de sauvegarde technique dangereux et
inutilisé (§6).

## 1. Endpoint

`GET api/backup/excel`, servi par un `BackupController` portant les mêmes attributs
que les autres contrôleurs : `[Authorize(Policy = "ServerSidePolicy")]` et
`[TenantRateLimit]`.

L'endpoint **n'accepte aucun paramètre** : ni tenant, ni client, ni utilisateur, ni
plage de dates. Il n'y a donc rien qu'un navigateur puisse falsifier.

Réponse :

| En-tête | Valeur |
| --- | --- |
| `Content-Type` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `Content-Disposition` | `attachment; filename="Sauvegarde_Garage_yyyy-MM-dd_HHmm.xlsx"` |
| `Cache-Control` | `private, no-store` (déjà appliqué par le proxy frontend) |

Le classeur est construit en mémoire et écrit dans la réponse. Aucun fichier
temporaire n'est créé sur disque.

## 2. Cloisonnement

Le périmètre ne vient pas d'un filtre applicatif : il vient de la **base à laquelle
la session est connectée**.

`MultiTenancyConnectionDriver.GetConnection` lit le nom du tenant exclusivement
depuis le claim `ClaimTypes.Spn` du principal authentifié, lève une exception s'il
est absent, et ne substitue que le nom de base — via `MultiTenancyDbName`, qui
impose `^[a-zA-Z0-9][a-zA-Z0-9_-]{0,62}$`. Un tenant A et un tenant B sont donc
deux bases distinctes, et aucune entrée HTTP ne participe à ce choix.

Cette propriété est **prouvée par test**, pas supposée :

- au niveau unitaire, `MultiTenancyDbName` refuse les noms de tenant hostiles et
  produit des noms de base distincts (déjà couvert par `TenantRoutingTests`) ;
- au niveau intégration, deux tenants réels sont peuplés de données distinctes et
  un JWT du tenant A ne doit faire apparaître aucune donnée du tenant B, dans
  aucune feuille du classeur.

Le second test reste pertinent bien que le déploiement actuel tourne en
`MultiTenancy.Enabled = false` : il verrouille le comportement avant que la
multi-tenance soit activée.

## 3. Contenu : douze onglets

`public.User` est **exclu en entier** : la table porte `Password` et
`Profile_Image`. Les personnes apparaissent via `domain.Employee`, qui ne contient
aucune donnée d'authentification.

| Onglet | Sources | Identifiants conservés |
| --- | --- | --- |
| Résumé | comptages par onglet, date d'export, nom du garage | — |
| Clients | `Client` + `PrivateClient`/`LegalClient` + `ClientEmail` regroupés | `client_id` |
| Véhicules | `Vehicle` + propriétaire courant via `VehicleRegistration` | `vehicle_id`, `client_id` |
| Interventions | `Work` + libellés client et véhicule + mécaniciens via `Assignment` | `work_id`, `client_id`, `vehicle_id`, `invoice_id` |
| Activités | `Offer` ∪ `RepairJob`, colonne Type | `activity_id`, `work_id`, `estimate_id` |
| Devis | `Estimate` + `Pricing` | `estimate_id`, `work_id` |
| Factures | `Invoice` + `Pricing` | `invoice_id`, `work_id` |
| Lignes atelier | `ServiceOffered`, `ProductOffered`, `ServicePerformed`, `ProductInstalled`, chacun joint à `Saleable`, colonne Type | `work_id`, `activity_id` |
| Lignes documents | `PricingLine` | `estimate_id`, `invoice_id` |
| Stock | `SparePart` + `Storage` + `UnitedMotorsPrice` | `sparepart_id`, `storage_id` |
| Employés | `Employee`, données métier utiles seulement | `employee_id` |
| Paramètres | `tenant_config.requisites` + `tenant_config.pricing`, à plat | — |

Les identifiants techniques sont conservés pour que la chaîne
client → véhicule → intervention → activité → devis → facture → lignes reste
reconstituable hors de l'application.

### Relations réelles

Les jointures suivent les clés étrangères du schéma, vérifiées dans
`Script0000_createSchema.sql` :

- `Estimate.Id` et `Invoice.Id` référencent tous deux `Pricing.Id` : le devis et la
  facture *sont* des `Pricing`. `PricingLine.PricingId` se joint donc directement à
  `Estimate.Id` ou `Invoice.Id` ; il n'existe pas de colonne `invoice_id` sur
  `PricingLine`.
- `Work.InvoiceId` porte le lien vers la facture ; le devis est atteint par
  `Offer.EstimateId`.
- `Saleable` est la table de base des quatre types de lignes ; chaque sous-type
  ajoute son rattachement (`OfferId` ou `RepairJobId`).
- Les collections (`ClientEmail`, `Assignment`) sont **regroupées** dans la ligne de
  leur entité, jamais dépliées en doublons.

### Pagination

L'export ignore la pagination de l'interface : il lit les tables en entier, en
quelques requêtes Dapper séquentielles sur `session.Connection`. Pas de N+1, pas de
lecteurs concurrents sur la connexion, et la connexion n'est ni fermée ni libérée —
elle appartient à NHibernate.

## 4. Format

- Première ligne figée et filtre automatique sur chaque onglet.
- Largeurs **prédéfinies par type de colonne**, avec un maximum. Pas
  d'`AdjustToContents()` sur tout le classeur : la mesure de texte y est coûteuse.
- **Montants en `decimal`**, écrits comme cellules numériques au format
  `# ##0,00 "MAD"`. Jamais de montant en texte. Aucun total n'est recalculé :
  les valeurs viennent telles quelles du backend.
- **Dates selon leur type PostgreSQL réel**, ce qui est une distinction de fond :
  - `timestamp with time zone` — un instant réel, converti en `Africa/Casablanca`,
    format `dd/MM/yyyy HH:mm` ;
  - `timestamp without time zone` et `date` — une date métier sans instant
    (échéance, date de production d'un véhicule). Aucune conversion de fuseau n'est
    appliquée : cela changerait la donnée. Format `dd/MM/yyyy`.
- **Injection de formules** : un helper unique écrit toute chaîne issue des données.
  Une valeur commençant par `=`, `+`, `-`, `@`, une tabulation, un retour chariot ou
  un saut de ligne est écrite en cellule de type texte, sans formule. Le résultat
  attendu est fonctionnel : `DataType` texte, aucune `FormulaA1`, aucune
  `FormulaR1C1`, aucun calcul exécuté à l'ouverture, et une valeur qui reste
  lisible.

## 5. Interface

Une section « Sauvegarde des données » dans Paramètres, construite sur les
primitives existantes (`Section`, `Button`), avec les textes suivants :

- description : « Téléchargez une copie Excel complète des données de votre garage
  afin de conserver une sauvegarde locale de vos clients, véhicules, interventions,
  devis, factures et autres données métier. »
- bouton : « Télécharger la sauvegarde Excel »
- pendant la génération : « Préparation de la sauvegarde… »
- erreur : « Impossible de générer la sauvegarde. Réessayez dans quelques instants. »
- avertissement discret : « Ce fichier contient des données personnelles et
  commerciales. Conservez-le dans un emplacement sécurisé. »

Le téléchargement reprend le motif éprouvé de `downloadPricing` : action serveur,
blob, ancre temporaire. Aucune dépendance frontend nouvelle. Aucune mention de mode
hors ligne, de synchronisation, d'import ou de restauration.

## 6. Suppression du `dbdump` existant

`GET api/options/dbdump` renvoie un `pg_dump` complet de la base à tout utilisateur
authentifié — donc `public.User` et ses hachages — et `DatabaseBackup` interpole le
mot de passe de connexion dans une ligne de commande shell.

Il est aujourd'hui inerte en Production : il est configuré sur `Program = ssh.exe`,
que l'image Linux n'embarque pas, et le frontend ne l'appelle nulle part. Mais il
suffirait d'ajouter `postgresql-client` à l'image pour en faire une fuite complète.

Sont donc supprimés : la route, l'injection de `DatabaseBackup` dans
`OptionsController`, la classe `DatabaseBackup`, son enregistrement DI et ses blocs
de configuration. `pg_dump` et `postgresql-client` ne sont pas ajoutés à l'image, et
aucune route équivalente n'est conservée. Un test vérifie que la route a disparu.

## 7. Hors périmètre

Aucune migration, aucune modification Supabase, Vercel, `vercel.json` ou variable
d'environnement Production. Aucun déploiement Production. Aucun changement de la
logique devis, facture ou intervention. Le démarrage à froid du backend est mesuré
mais pas corrigé ici.
