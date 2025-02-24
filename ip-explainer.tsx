"use client"

import { Input } from "@/components/ui/input"

export default function Component() {
  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <Input type="text" placeholder="Enter IP address..." className="w-full text-lg" defaultValue="10.69.12.34" />

        <div className="relative bg-white p-6 rounded-lg border">
          {/* IP Address Display */}
          <div className="relative font-mono text-xl mb-20">10.69.12.34</div>

          {/* Explanatory Text with Connecting Lines */}
          <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: "none" }}>
            <path d="M 72 32 L 72 16 L 180 16" stroke="rgb(200,200,200)" fill="none" strokeWidth="1.5" />
            <path d="M 95 32 L 95 22 L 180 22" stroke="rgb(200,200,200)" fill="none" strokeWidth="1.5" />
            <path d="M 118 32 L 118 28 L 180 28" stroke="rgb(200,200,200)" fill="none" strokeWidth="1.5" />
            <path d="M 141 32 L 141 34 L 180 34" stroke="rgb(200,200,200)" fill="none" strokeWidth="1.5" />
          </svg>

          {/* Explanatory Text */}
          <div className="absolute left-[180px] top-[8px] space-y-[12px] text-sm">
            <div>Internal Mesh Address</div>
            <div>Mesh Bridge Centrally Managed Address</div>
            <div>First NN Component</div>
            <div>Second NN Component</div>
          </div>

          {/* Network Number */}
          <div className="mt-8 text-sm text-muted-foreground">Network Number: 1234</div>
        </div>
      </div>
    </div>
  )
}

