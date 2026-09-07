#!/bin/bash
set -e

# Paths
APPSETTINGS=backend/src/Carmasters.Http.Api/appsettings.Secrets.json
ENVFILE=frontend/.env
DOCKER_ENVFILE=.env
CREDENTIALS_FILE=local-credentials.txt

# Secrets
JWT_SECRET=$(openssl rand -hex 64)
CONSUMER_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
DB_USER="carcare_$(openssl rand -hex 4)"
DB_PASSWORD=$(openssl rand -base64 32)
ADMIN_USERNAME="admin_$(openssl rand -hex 3)"
ADMIN_PASSWORD=$(openssl rand -hex 16)
ADMIN_EMAIL="admin@example.invalid"

# appsettings.Secrets.json
cp ${APPSETTINGS}.example $APPSETTINGS
sed -i.bak "s|\"Secret\": \".*\"|\"Secret\": \"$JWT_SECRET\"|" $APPSETTINGS
sed -i.bak "s|\"ConsumerSecret\": \".*\"|\"ConsumerSecret\": \"$CONSUMER_SECRET\"|" $APPSETTINGS
sed -i.bak "/\"DbOptions\"/,/\"MultiTenancy\"/ s|\"UserId\": \".*\"|\"UserId\": \"$DB_USER\"|" $APPSETTINGS
sed -i.bak "/\"DbOptions\"/,/\"MultiTenancy\"/ s|\"Password\": \".*\"|\"Password\": \"$DB_PASSWORD\"|" $APPSETTINGS
rm $APPSETTINGS.bak

# .env
cp ${ENVFILE}.example $ENVFILE
sed -i.bak "s|SERVER_SECRET=.*|SERVER_SECRET=$CONSUMER_SECRET|" $ENVFILE
sed -i.bak "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" $ENVFILE
rm $ENVFILE.bak

cat > "$DOCKER_ENVFILE" <<EOF
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=carcare
WEB_PORT=3000
CARCARE_ADMIN_USERNAME=$ADMIN_USERNAME
CARCARE_ADMIN_PASSWORD=$ADMIN_PASSWORD
CARCARE_ADMIN_EMAIL=$ADMIN_EMAIL
EOF

cat > "$CREDENTIALS_FILE" <<EOF
CarCare local credentials
=========================
Application username: $ADMIN_USERNAME
Application password: $ADMIN_PASSWORD
Database username: $DB_USER
Database password: $DB_PASSWORD
EOF

chmod 600 "$DOCKER_ENVFILE" "$CREDENTIALS_FILE" "$APPSETTINGS" "$ENVFILE"

echo "✅ Secrets initialized"
