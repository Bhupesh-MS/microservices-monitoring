# Kubernetes Microservices Monitoring

![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Autoscaling-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue)
![Prometheus](https://img.shields.io/badge/Prometheus-Monitoring-orange)
![Grafana](https://img.shields.io/badge/Grafana-Dashboards-orange)

> A robust, Redis-backed Node.js microservices ecosystem designed for Kubernetes autoscaling and comprehensive observability using Prometheus and Grafana.

---

## 📖 Table of Contents

- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Local Development & Testing](#-local-development--testing)
- [Docker Build & Registry](#-docker-build--registry)
- [Kubernetes Deployment](#-kubernetes-deployment)
- [Observability & Monitoring](#-observability--monitoring)
- [Load Testing & Autoscaling](#-load-testing--autoscaling)
- [Cleanup](#-cleanup)

---

## 🏗 Architecture

The system consists of three main Node.js microservices communicating via Redis, fully orchestrated on Kubernetes.

- **API Gateway (`api`)**: Exposes REST endpoints (`POST /submit`, `GET /status/:id`) and pushes prime calculation jobs to a Redis queue.
- **Worker Node (`worker`)**: Consumes jobs from Redis, calculates prime numbers up to the submitted limit, stores the results, and exposes `/metrics` for Prometheus.
- **Stats Service (`stats`)**: Aggregates queue length and job counters, exposing both REST (`GET /stats`) and Prometheus metrics (`/metrics`).
- **Redis**: Serves as the message broker, job status store, and shared state for aggregate counters.
- **Horizontal Pod Autoscaler (HPA)**: Automatically scales worker pods from 2 up to 10 replicas when CPU utilization exceeds 70%.
- **Prometheus/Grafana**: Gathers metrics via Kubernetes `ServiceMonitor` and visualizes them on real-time dashboards.

---

## 💻 Tech Stack

- **Backend**: Node.js 20+, Express.js
- **Message Broker & Cache**: Redis
- **Containerization**: Docker
- **Orchestration**: Kubernetes (Minikube / Kind), Helm
- **Observability**: Prometheus, Grafana, Kube-Prometheus-Stack
- **Code Quality**: ESLint, Prettier, Husky, Commitlint
- **Testing**: Native Node.js Test Runner

---

## 🚀 Prerequisites

Ensure you have the following installed on your machine:

- [Docker](https://www.docker.com/)
- [Node.js 20+](https://nodejs.org/) & npm
- [Kubernetes CLI (`kubectl`)](https://kubernetes.io/docs/tasks/tools/)
- Local Cluster: [Minikube](https://minikube.sigs.k8s.io/docs/start/) or [Kind](https://kind.sigs.k8s.io/)
- [Helm](https://helm.sh/)
- ApacheBench (`ab`) for stress testing

> **Note for HPA**: For the autoscaler to function locally, you must install the metrics-server.
> Minikube: `minikube addons enable metrics-server`

---

## 🛠 Local Development & Testing

The project uses npm workspaces to manage services and shared packages.

### 1. Environment Setup

Copy the sample environment file to configure your local variables:

```bash
cp .env.sample .env
```

### 2. Install Dependencies

```bash
npm install
```

### 2. Code Quality & Formatting

Run linting and formatting checks across all packages:

```bash
npm run lint
npm run format:check
```

### 3. Testing

Run the complete test suite with coverage:

```bash
npm test
npm run test:coverage
```

You can also run tests for individual workspaces:

```bash
npm run test:api
npm run test:worker
npm run test:stats
npm run test:env
npm run test:logger
npm run test:redis
```

### 4. Running Locally

Run all three services concurrently from the root directory:

```bash
npm start
```

Alternatively, run them individually:

```bash
npm run dev --workspace services/api
npm run dev --workspace services/worker
npm run dev --workspace services/stats
```

---

## 🐳 Docker Build & Registry

To deploy to a Kubernetes cluster, build the Docker images. From the repository root:

```bash
docker build -f services/api/Dockerfile -t microservices-monitoring/api:1.0.0 .
docker build -f services/worker/Dockerfile -t microservices-monitoring/worker:1.0.0 .
docker build -f services/stats/Dockerfile -t microservices-monitoring/stats:1.0.0 .
```

### Minikube Tip

Build the images directly inside the Minikube Docker daemon so they are immediately available to the cluster:

```bash
eval "$(minikube docker-env)"
docker build -f services/api/Dockerfile -t microservices-monitoring/api:1.0.0 .
docker build -f services/worker/Dockerfile -t microservices-monitoring/worker:1.0.0 .
docker build -f services/stats/Dockerfile -t microservices-monitoring/stats:1.0.0 .
```

### Kind Tip

Load the built images into your Kind cluster:

```bash
kind load docker-image microservices-monitoring/api:1.0.0
kind load docker-image microservices-monitoring/worker:1.0.0
kind load docker-image microservices-monitoring/stats:1.0.0
```

---

## 🚢 Kubernetes Deployment

### 1. Prometheus and Grafana

Install the Kube-Prometheus stack via Helm:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack
```

Wait for the monitoring pods to be ready:

```bash
kubectl get pods -l "release=prometheus"
```

### 2. Microservices

You can deploy all services automatically using the provided shell script, which also enables the required Minikube add-ons (metrics-server and ingress):

```bash
bash scripts/deploy-k8s.sh
```

Alternatively, to apply manifests manually using Kustomize:

```bash
minikube addons enable ingress
minikube addons enable metrics-server
kubectl apply -k .
```

---

## 📊 Observability & Monitoring

### Accessing Grafana

Grafana is now accessible directly via Ingress without port-forwarding.

- **URL**: `http://grafana.microservices.local`
- **Username**: `admin`
- **Password**: `admin` (Configured during deployment)

Import the provided dashboard `grafana/dashboard.json` to view real-time metrics including:

- Worker CPU and memory usage
- Worker replica count and HPA desired replicas
- Redis queue length
- Submitted and completed job totals
- Job processing latency
- Worker throughput and errors

---

## ⚡ Load Testing & Autoscaling

Simulate a burst of traffic to trigger the Horizontal Pod Autoscaler (HPA).

### 1. DNS Configuration (Ingress)

To test the application via Ingress, you must map the Ingress hostname to your Minikube IP.
Find your Minikube IP:

```bash
minikube ip
```

Add the following line to your `/etc/hosts` file (requires `sudo`):

```text
<your-minikube-ip> api.microservices.local worker.microservices.local stats.microservices.local grafana.microservices.local
```

### 2. Run Stress Test

Using ApacheBench (`ab`), run the assignment load test against the API via its Ingress hostname:

```bash
printf '{"limit":100000}' > /tmp/prime-job.json
ab -n 5000 -c 200 -p /tmp/prime-job.json -T application/json http://api.microservices.local/submit
```

### 3. Observe Autoscaling

Watch the system while the test runs:

```bash
kubectl get hpa worker-hpa --watch
kubectl get pods -l app=worker --watch
kubectl logs deploy/worker -f
```

**Expected Observations:**

- Redis queue length grows rapidly during the burst.
- Worker CPU usage rises as pods process prime jobs.
- HPA automatically increases worker replicas when average CPU exceeds 70%.
- Queue length drains as new worker pods become ready and process tasks.
- Grafana panels update in real-time reflecting totals, latency, and queue length.

---

## 🧹 Cleanup

Remove all resources from your cluster to free up resources:

```bash
kubectl delete -f k8s/service-monitors/
kubectl delete -f k8s/hpa.yaml
kubectl delete -f k8s/stats.yaml
kubectl delete -f k8s/worker.yaml
kubectl delete -f k8s/api.yaml
kubectl delete -f k8s/redis.yaml
helm uninstall prometheus
```
