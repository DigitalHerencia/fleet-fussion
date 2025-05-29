"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoreHorizontal, Plus, Search, Mail, Users, UserCheck, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { SystemRoles, type SystemRole } from "@/types/abac"
import { createOrganizationInvitation, getOrganizationInvitations, revokeOrganizationInvitation, type InvitationData } from "@/lib/actions/invitation-actions"

interface OrganizationInvitation {
  id: string
  emailAddress: string
  role: string
  status: string
  createdAt: string
  publicMetadata?: any
}

export function UserSettings() {
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState(true)
  const [newInvitation, setNewInvitation] = useState({
    email: "",
    role: "" as SystemRole | "",
    bypassOnboarding: true,
  })

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "accepted":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Accepted</Badge>
      case "revoked":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Revoked</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    const roleColors = {
      [SystemRoles.ADMIN]: "bg-red-100 text-red-800",
      [SystemRoles.DISPATCHER]: "bg-blue-100 text-blue-800",
      [SystemRoles.DRIVER]: "bg-green-100 text-green-800",
      [SystemRoles.COMPLIANCE_OFFICER]: "bg-purple-100 text-purple-800",
      [SystemRoles.ACCOUNTANT]: "bg-orange-100 text-orange-800",
      [SystemRoles.VIEWER]: "bg-gray-100 text-gray-800",
    }
    
    return (
      <Badge className={roleColors[role as SystemRole] || "bg-gray-100 text-gray-800"}>
        {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    )
  }

  // Load invitations on component mount
  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    if (!user?.publicMetadata?.organizationId) return

    setLoadingInvitations(true)
    try {
      const result = await getOrganizationInvitations(user.publicMetadata.organizationId as string)
      // Note: Since Clerk doesn't provide direct invitation listing, we'll show a placeholder
      // In a real implementation, you'd track invitations in your own database
      setInvitations([])
    } catch (error) {
      console.error("Error loading invitations:", error)
      setInvitations([])
    } finally {
      setLoadingInvitations(false)
    }
  }

  const handleInvitationChange = (field: string, value: string | boolean) => {
    setNewInvitation((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!user?.publicMetadata?.organizationId) return

    try {
      const result = await revokeOrganizationInvitation(
        user.publicMetadata.organizationId as string,
        invitationId
      )

      if (result.success) {
        toast({
          title: "Invitation Revoked",
          description: "The invitation has been successfully revoked.",
        })
        await loadInvitations() // Refresh the list
      } else {
        toast({
          title: "Failed to Revoke Invitation",
          description: result.error || "An error occurred while revoking the invitation.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error revoking invitation:", error)
      toast({
        title: "Error",
        description: "Failed to revoke invitation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSendInvitation = async () => {
    if (!newInvitation.email || !newInvitation.role) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and role for the invitation.",
        variant: "destructive",
      })
      return
    }

    if (!user?.publicMetadata?.organizationId) {
      toast({
        title: "Error",
        description: "Organization context not found. Please try again.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const invitationData: InvitationData = {
        emailAddress: newInvitation.email,
        role: newInvitation.role as SystemRole,
        organizationId: user.publicMetadata.organizationId as string,
        bypassOnboarding: newInvitation.bypassOnboarding,
        redirectUrl: `${window.location.origin}/accept-invitation`,
      }

      const result = await createOrganizationInvitation(invitationData)

      if (result.success) {
        toast({
          title: "Invitation Sent",
          description: `Invitation has been sent to ${newInvitation.email}`,
        })
        
        // Reset form
        setNewInvitation({
          email: "",
          role: "" as SystemRole | "",
          bypassOnboarding: true,
        })
        setIsInviteUserOpen(false)
        
        // Refresh invitations list
        await loadInvitations()
      } else {
        toast({
          title: "Failed to Send Invitation",
          description: result.error || "An error occurred while sending the invitation.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter invitations based on search term
  const filteredInvitations = invitations.filter(invitation =>
    invitation.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invitation.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Tabs defaultValue="invitations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invitations
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search invitations..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Send Organization Invitation</DialogTitle>
                  <DialogDescription>
                    Invite a new user to join your organization with a specific role.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      className="col-span-3"
                      value={newInvitation.email}
                      onChange={(e) => handleInvitationChange("email", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <Select 
                      value={newInvitation.role} 
                      onValueChange={(value) => handleInvitationChange("role", value)}
                    >
                      <SelectTrigger id="role" className="col-span-3">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SystemRoles.ADMIN}>Admin</SelectItem>
                        <SelectItem value={SystemRoles.DISPATCHER}>Dispatcher</SelectItem>
                        <SelectItem value={SystemRoles.DRIVER}>Driver</SelectItem>
                        <SelectItem value={SystemRoles.COMPLIANCE_OFFICER}>Compliance Officer</SelectItem>
                        <SelectItem value={SystemRoles.ACCOUNTANT}>Accountant</SelectItem>
                        <SelectItem value={SystemRoles.VIEWER}>Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bypass" className="text-right">
                      Settings
                    </Label>
                    <div className="col-span-3 flex items-center space-x-2">
                      <Checkbox
                        id="bypass"
                        checked={newInvitation.bypassOnboarding}
                        onCheckedChange={(checked) => 
                          handleInvitationChange("bypassOnboarding", checked as boolean)
                        }
                      />
                      <Label htmlFor="bypass" className="text-sm">
                        Bypass onboarding process
                      </Label>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsInviteUserOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSendInvitation} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Invitation"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Settings</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingInvitations ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-sm text-muted-foreground">Loading invitations...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        {searchTerm ? "No invitations match your search." : "Invitation tracking not yet implemented."}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Invitations are sent successfully, but tracking pending invitations requires additional database setup.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.emailAddress}</TableCell>
                      <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell>
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {invitation.publicMetadata?.bypassOnboarding ? (
                          <Badge variant="outline" className="text-xs">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Skip Onboarding
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Standard Flow</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {invitation.status.toLowerCase() === "pending" && (
                              <DropdownMenuItem 
                                onClick={() => handleRevokeInvitation(invitation.id)}
                                className="text-red-600"
                              >
                                Revoke Invitation
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="rounded-md border p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Member Management</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Member management functionality will be available in a future update.
            </p>
            <p className="text-xs text-muted-foreground">
              For now, you can manage organization members through the Clerk dashboard.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
