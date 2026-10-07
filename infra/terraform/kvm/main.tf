terraform {
  required_version = ">= 1.0.0"
  required_providers {
    libvirt = {
      source  = "dmacvicar/libvirt"
      version = "~> 0.7.1"
    }
  }
}

variable "ssh_public_key_path" {
  description = "Path to the public SSH key to inject into the VM"
  type        = string
  default     = "~/.ssh/payment_gateway_vm.pub"
}

provider "libvirt" {
  # Connect to the local KVM hypervisor
  uri = "qemu:///system"
}

# 1. Cloud-init user data configuration
data "template_file" "user_data" {
  template = file("${path.module}/cloud_init.cfg")
  vars = {
    ssh_public_key = file(var.ssh_public_key_path)
  }
}

resource "libvirt_cloudinit_disk" "commoninit" {
  name      = "commoninit.iso"
  user_data = data.template_file.user_data.rendered
  pool      = "default"
}

# 2. Define the Base OS Image (Ubuntu 24.04 LTS)
resource "libvirt_volume" "ubuntu2404_image" {
  name   = "ubuntu-24.04-base.qcow2"
  pool   = "default"
  source = "https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img"
  format = "qcow2"
}

# 3. Create a 80GB disk for the Payment Gateway VM
resource "libvirt_volume" "payment_gateway_disk" {
  name           = "payment-gateway-lab.qcow2"
  pool           = "default"
  size           = 85899345920 # 80GB in bytes
  base_volume_id = libvirt_volume.ubuntu2404_image.id
}

# 4. Define the Virtual Machine (Domain)
resource "libvirt_domain" "payment_gateway" {
  name   = "payment-gateway-lab"
  memory = "8192" # 8GB
  vcpu   = 4

  cloudinit = libvirt_cloudinit_disk.commoninit.id

  network_interface {
    network_name = "default"
    # Wait for the VM to get an IP address via DHCP
    wait_for_lease = true
  }

  disk {
    volume_id = libvirt_volume.payment_gateway_disk.id
  }

  console {
    type        = "pty"
    target_port = "0"
    target_type = "serial"
  }

  graphics {
    type        = "spice"
    listen_type = "address"
    autoport    = true
  }
}

# 5. Output the dynamically assigned IP address
output "vm_ip_address" {
  value       = libvirt_domain.payment_gateway.network_interface[0].addresses[0]
  description = "The IP address of the newly provisioned VM"
}
