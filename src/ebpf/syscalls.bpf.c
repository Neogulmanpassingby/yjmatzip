#include "vmlinux.h"
#include <bpf/bpf_helpers.h>

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
    __type(key, u32);
    __type(value, u64);
} syscall_total SEC(".maps");

SEC("tracepoint/raw_syscalls/sys_enter")
int tracepoint__raw_syscalls__sys_enter(struct trace_event_raw_sys_enter *ctx) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    u64 *val, zero = 0;

    val = bpf_map_lookup_elem(&syscall_total, &pid);
    if (val) {
        __sync_fetch_and_add(val, 1);
    } else {
        bpf_map_update_elem(&syscall_total, &pid, &zero, BPF_ANY);
    }
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
