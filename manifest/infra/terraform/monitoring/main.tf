# ==========================================
# Providers
# ==========================================
provider "kubernetes" {
  config_path = "~/.kube/config"
}

provider "helm" {
  kubernetes = {
    config_path = "~/.kube/config"
  }
}

# ==========================================
# Namespace
# ==========================================
resource "kubernetes_namespace" "monitoring" {
  metadata { name = "monitoring" }
}

# ==========================================
# kube-prometheus-stack
# ==========================================
resource "helm_release" "kube_prom_stack" {
  name       = "kube-prom"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name

  values = [<<-EOT
    prometheus:
      prometheusSpec:
        retention: 3d
        resources:
          requests:
            memory: "256Mi"
          limits:
            memory: "512Mi"
    grafana:
      resources:
        requests:
          memory: "128Mi"
        limits:
          memory: "256Mi"
      service:
        type: NodePort
        nodePorts:
          http: 30000
    EOT
  ]
}

# ==========================================
# Loki Stack
# ==========================================
resource "helm_release" "loki_stack" {
  name       = "loki"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "loki-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name

  values = [<<-EOT
    loki:
      persistence:
        enabled: true
        size: 10Gi
      isDefault: false
    promtail:
      enabled: true
    EOT
  ]
}
