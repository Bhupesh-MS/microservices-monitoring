# Kubernetes Microservices Monitoring Assignment

This project contains a Redis-backed Node.js microservices system designed for Kubernetes autoscaling and Prometheus/Grafana observability.

## Architecture

- **API:** exposes `POST /submit`, `GET /submit`, and `GET /status/:id`; pushes jobs into Redis.
- **Worker:** consumes Redis jobs, runs CPU-heavy work, stores results, and exposes `/metrics`.
- **Stats:** exposes `GET /stats` and `/metrics` for queue length and aggregate job counters.
- **Redis:** queue, job status store, and aggregate counters.
- **HPA:** scales worker pods from 2 to 10 replicas when CPU utilization exceeds 70%.
- **Monitoring:** `ServiceMonitor` resources scrape worker and stats pods with kube-prometheus-stack.

## Prerequisites

- Docker
- Node.js 20+
- npm
- kubectl
- Minikube or Kind
- Helm
- ApacheBench (`ab`) or another HTTP load tool

For HPA to work locally, install metrics-server:

```bash
minikube addons enable metrics-server
```

For Kind, install metrics-server with a configuration suitable for local clusters.

## Local Development

Install all workspace dependencies from the repository root:

```bash
npm install
```

Run quality checks for every service and shared package:

```bash
npm run lint
npm run format:check
npm test
```

Run one workspace test suite from the root:

```bash
npm run test:api
npm run test:worker
npm run test:stats
npm run test:env
npm run test:logger
npm run test:redis
```

Run an individual service:

```bash
npm run dev --workspace services/api
npm run dev --workspace services/worker
npm run dev --workspace services/stats
```

Shared utilities are split into independent workspace packages:

- `packages/env` provides `@microservices-monitoring/env`.
- `packages/logger` provides `@microservices-monitoring/logger`.
- `packages/redis` provides `@microservices-monitoring/redis`.

Local environment values live in the root `.env` file. Each service reads only the variables it needs from that file or from its deployment environment.

## Build Images

From the `microservices-monitoring` directory:

```bash
docker build -f services/api/Dockerfile -t microservices-monitoring/api:latest .
docker build -f services/worker/Dockerfile -t microservices-monitoring/worker:latest .
docker build -f services/stats/Dockerfile -t microservices-monitoring/stats:latest .
```

For Minikube, build inside the Minikube Docker daemon:

```bash
eval "$(minikube docker-env)"
docker build -f services/api/Dockerfile -t microservices-monitoring/api:latest .
docker build -f services/worker/Dockerfile -t microservices-monitoring/worker:latest .
docker build -f services/stats/Dockerfile -t microservices-monitoring/stats:latest .
```

For Kind, load local images into the cluster:

```bash
kind load docker-image microservices-monitoring/api:latest
kind load docker-image microservices-monitoring/worker:latest
kind load docker-image microservices-monitoring/stats:latest
```

## Deploy Prometheus and Grafana

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack
```

Wait for monitoring pods:

```bash
kubectl get pods -l "release=prometheus"
```

## Deploy the Application

```bash
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/api.yaml
kubectl apply -f k8s/worker.yaml
kubectl apply -f k8s/stats.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/service-monitors/
```

If you use the NGINX ingress controller, also apply:

```bash
kubectl apply -f k8s/ingress.yaml
```

For Minikube ingress:

```bash
minikube addons enable ingress
```

## Access Services

LoadBalancer path with Minikube:

```bash
minikube service api --url
```

Ingress path:

```bash
minikube ip
```

Add the IP to `/etc/hosts`:

```text
<minikube-ip> microservices.local
```

Then use:

```bash
curl -X POST http://microservices.local/submit
curl http://microservices.local/status/<job-id>
```

Stats can be checked with port-forwarding:

```bash
kubectl port-forward svc/stats 3001:3000
curl http://localhost:3001/stats
```

## Stress Test

Run the assignment load test against the API:

```bash
ab -n 5000 -c 200 http://<api-url>/submit
```

Because `/submit` supports both `GET` and `POST`, the ApacheBench command above works directly. To send POST requests:

```bash
ab -n 5000 -c 200 -p /dev/null -T application/json http://<api-url>/submit
```

Watch the system while the test runs:

```bash
kubectl get hpa worker-hpa --watch
kubectl get pods -l app=worker --watch
kubectl logs deploy/worker -f
```

Expected observations:

- Redis queue length grows during the burst.
- Worker CPU rises as pods process prime, bcrypt, and sort jobs.
- HPA increases worker replicas when average CPU exceeds 70%.
- Queue length drains as new worker pods become ready.
- Grafana updates job totals, latency, queue length, and error panels.

## Grafana Dashboard

Port-forward Grafana:

```bash
kubectl port-forward svc/prometheus-grafana 3000:80
```

Get the Grafana admin password:

```bash
kubectl get secret prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode
```

Open `http://localhost:3000`, sign in as `admin`, then import:

```text
grafana/dashboard.json
```

The dashboard includes:

- Worker CPU and memory usage
- Worker replica count and HPA desired replicas
- Redis queue length
- Submitted and completed job totals
- Job processing latency
- Worker throughput and errors

## Screenshots and Report Notes

Add your screenshots after running the stress test:

- Grafana dashboard before load
- Grafana dashboard during peak load
- HPA output showing worker scaling
- Grafana dashboard after queue drain

Suggested observations to include:

- Peak queue length
- Maximum worker replica count
- Approximate time for HPA to react
- Approximate time for the queue to drain
- Any job errors seen during the test

## Useful Commands

```bash
kubectl get all
kubectl describe hpa worker-hpa
kubectl port-forward svc/worker 3002:3000
curl http://localhost:3002/metrics
kubectl port-forward svc/stats 3001:3000
curl http://localhost:3001/metrics
```

## Cleanup

```bash
kubectl delete -f k8s/service-monitors/
kubectl delete -f k8s/hpa.yaml
kubectl delete -f k8s/stats.yaml
kubectl delete -f k8s/worker.yaml
kubectl delete -f k8s/api.yaml
kubectl delete -f k8s/redis.yaml
helm uninstall prometheus
```
