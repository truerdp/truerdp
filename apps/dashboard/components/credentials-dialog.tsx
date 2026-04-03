"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"

export default function CredentialsDialog({ instanceId }: any) {
  const [data, setData] = useState<any>(null)

  const fetchCredentials = async () => {
    const res = await api(`/instances/${instanceId}/credentials`, {
      method: "POST",
    })
    setData(res)
  }

  return (
    <Dialog>
      <DialogTrigger
        render={<Button onClick={fetchCredentials}>Show Credentials</Button>}
      />

      <DialogContent>
        {data ? (
          <div>
            <p>IP: {data.ipAddress}</p>
            <p>Username: {data.username}</p>
            <p>Password: {data.password}</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
