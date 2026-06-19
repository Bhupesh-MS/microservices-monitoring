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
echo "To test the application, run the following commands in your terminal:"
echo ""
echo "1. Port-forward the API (runs in background):"
echo "   kubectl port-forward svc/api 3000:80 &"
echo ""
echo "2. Port-forward Grafana (runs in background):"
echo "   kubectl port-forward svc/prometheus-grafana 3005:80 &"
echo ""
echo "3. Run the stress test:"
echo "   ab -n 5000 -c 200 http://localhost:3000/submit"
echo "--------------------------------------------------------"
