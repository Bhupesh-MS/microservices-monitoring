#!/bin/bash
set -e

echo "Starting Kubernetes deployment..."

# 1. Start minikube if not running
if ! minikube status > /dev/null 2>&1; then
    echo "Starting minikube..."
    minikube start --driver=docker
else
    echo "Minikube is already running."
fi

# Enable metrics-server for HPA
echo "Enabling metrics-server..."
minikube addons enable metrics-server

# Enable Ingress controller
echo "Enabling ingress controller..."
minikube addons enable ingress

# 2. Build Docker images
echo "Building Docker images..."
docker build -t microservices-monitoring/api:1.0.0 -f services/api/Dockerfile .
docker build -t microservices-monitoring/worker:1.0.0 -f services/worker/Dockerfile .
docker build -t microservices-monitoring/stats:1.0.0 -f services/stats/Dockerfile .

# 3. Load images into minikube
echo "Loading images into minikube..."
minikube image load microservices-monitoring/api:1.0.0
minikube image load microservices-monitoring/worker:1.0.0
minikube image load microservices-monitoring/stats:1.0.0

# 4. Setup Prometheus & Grafana stack
echo "Setting up Prometheus & Grafana (kube-prometheus-stack)..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
# Use upgrade --install so it works both for initial installation and subsequent updates
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --set grafana.adminPassword=admin

# 5. Apply Kubernetes manifests
echo "Applying Kubernetes configurations..."
kubectl apply -k .

echo ""
echo "Deployment complete!"
echo "--------------------------------------------------------"
echo "To test the application via Ingress, follow these steps:"
echo ""
echo "1. MANUALLY UPDATE /etc/hosts:"
echo "   Get your Minikube IP by running:"
echo "     minikube ip"
echo "   Then, add this line to your /etc/hosts file (requires sudo):"
echo "     <your-minikube-ip> api.microservices.local worker.microservices.local stats.microservices.local grafana.microservices.local"
echo ""
echo "2. Access Services (No port-forwarding needed!):"
echo "   - API:      http://api.microservices.local"
echo "   - Worker:   http://worker.microservices.local"
echo "   - Stats:    http://stats.microservices.local"
echo "   - Grafana:  http://grafana.microservices.local (User: admin, Pass: admin)"
echo ""
echo "3. Run the stress test against the API:"
echo "   ab -n 5000 -c 200 http://api.microservices.local/submit"
echo "--------------------------------------------------------"
