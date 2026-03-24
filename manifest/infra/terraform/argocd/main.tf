#---------
#Providers
#---------
provider "kubernetes" {
  config_path = "~/.kube/config"
}

provider "helm" {
  kubernetes = {
    config_path = "~/.kube/config"
  }
}

#---------
#Namespace
#---------

resource "kubernetes_namespace_v1" "argocd" {
  metadata { name = "argocd" }
}

#------
#argocd
#------

resource "helm_release" "argocd" {
  name           = "argocd"
  repository     = "https://argoproj.github.io/argo-helm"
  chart          = "argo-cd"
  version          = "9.4.15"

  namespace = kubernetes_namespace_v1.argocd.metadata[0].name
  create_namespace = false
}
