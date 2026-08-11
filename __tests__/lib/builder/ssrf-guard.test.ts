import { describe, it, expect } from "vitest"
import { validateFetchTarget } from "@/lib/builder/utils/fetch-target"

describe("validateFetchTarget - SSRF guard", () => {
  // https-only (http:// rejected unless localhost dev)
  it("rejects http:// URLs", () => {
    expect(() => validateFetchTarget("http://example.com")).toThrow()
  })

  it("rejects http://169.254.169.254/ (metadata)", () => {
    expect(() => validateFetchTarget("http://169.254.169.254/")).toThrow()
  })

  it("rejects http://127.0.0.1/ (loopback)", () => {
    expect(() => validateFetchTarget("http://127.0.0.1/")).toThrow()
  })

  it("rejects http://localhost/ (localhost)", () => {
    expect(() => validateFetchTarget("http://localhost/")).toThrow()
  })

  it("rejects http://10.0.0.1/ (RFC1918)", () => {
    expect(() => validateFetchTarget("http://10.0.0.1/")).toThrow()
  })

  it("rejects http://192.168.1.1/ (RFC1918)", () => {
    expect(() => validateFetchTarget("http://192.168.1.1/")).toThrow()
  })

  it("rejects http://[::1]/ (IPv6 loopback)", () => {
    expect(() => validateFetchTarget("http://[::1]/")).toThrow()
  })

  // https accepted
  it("accepts https://example.com", () => {
    expect(() => validateFetchTarget("https://example.com")).not.toThrow()
  })

  // Additional cases
  it("rejects https://169.254.169.254/ (metadata over https)", () => {
    expect(() => validateFetchTarget("https://169.254.169.254/")).toThrow()
  })

  it("rejects https://127.0.0.1/ (loopback over https)", () => {
    expect(() => validateFetchTarget("https://127.0.0.1/")).toThrow()
  })

  it("rejects https://localhost/ (localhost over https)", () => {
    expect(() => validateFetchTarget("https://localhost/")).toThrow()
  })

  it("rejects https://10.0.0.1/ (RFC1918 over https)", () => {
    expect(() => validateFetchTarget("https://10.0.0.1/")).toThrow()
  })

  it("rejects https://192.168.1.1/ (RFC1918 over https)", () => {
    expect(() => validateFetchTarget("https://192.168.1.1/")).toThrow()
  })

  it("rejects https://[::1]/ (IPv6 loopback over https)", () => {
    expect(() => validateFetchTarget("https://[::1]/")).toThrow()
  })

  it("rejects https://172.16.0.1/ (RFC1918 172.16/12)", () => {
    expect(() => validateFetchTarget("https://172.16.0.1/")).toThrow()
  })

  it("rejects https://172.31.255.255/ (RFC1918 172.16/12)", () => {
    expect(() => validateFetchTarget("https://172.31.255.255/")).toThrow()
  })

  it("accepts https://example.org", () => {
    expect(() => validateFetchTarget("https://example.org")).not.toThrow()
  })

  it("accepts https://subdomain.example.com", () => {
    expect(() => validateFetchTarget("https://subdomain.example.com")).not.toThrow()
  })
})