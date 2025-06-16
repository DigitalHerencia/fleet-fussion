/** @format */

"use client"

import { put } from "@vercel/blob/client"
import { Download, Eye, FileText, Upload, X } from "lucide-react"
import { useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { getSignedUploadToken } from "@/lib/actions/fileUploadActions"
import {
    createLoadDocumentAction,
    deleteLoadDocumentAction,
} from "@/lib/actions/loadDocumentActions"
import type { LoadDocument } from "@/types/dispatch"

interface LoadDocumentUploadProps {
    loadId: string
    documents?: LoadDocument[]
    onDocumentUploaded?: () => void
}

interface LoadDocumentFormData {
    name: string
    type: LoadDocument["type"]
    category: LoadDocument["category"]
    description: string
    isRequired: boolean
}

export function LoadDocumentUpload({
    loadId,
    documents = [],
    onDocumentUploaded,
}: LoadDocumentUploadProps) {
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState<LoadDocumentFormData>({
        name: "",
        type: "other",
        category: "administrative",
        description: "",
        isRequired: false,
    })

    const handleFileSelect = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file
        if (file.size > 10 * 1024 * 1024) {
            // 10MB limit
            toast({
                title: "File too large",
                description: "Please select a file smaller than 10MB",
                variant: "destructive",
            })
            return
        }

        if (!/\.(pdf|jpg|jpeg|png|doc|docx)$/i.test(file.name)) {
            toast({
                title: "Invalid file type",
                description:
                    "Only PDF, JPG, PNG, DOC, and DOCX files are allowed",
                variant: "destructive",
            })
            return
        } // Auto-fill name if not provided
        if (!formData.name) {
            const fileName = file.name.split(".")[0] ?? file.name
            setFormData(prev => ({ ...prev, name: fileName }))
        }

        setIsUploading(true)
        setUploadProgress(0)

        try {
            // Get signed upload token
            const tokenRes = await getSignedUploadToken(file.name)
            if (!tokenRes.success || !("token" in tokenRes)) {
                throw new Error("Failed to get upload token")
            }

            setUploadProgress(25)

            // Upload file to blob storage
            const { url } = await put(tokenRes.pathname, file, {
                access: "public",
                token: tokenRes.token,
            })

            setUploadProgress(75)

            // Save document metadata
            const result = await createLoadDocumentAction({
                loadId,
                name: formData.name || file.name,
                type: formData.type,
                category: formData.category,
                description: formData.description,
                isRequired: formData.isRequired,
                url,
                fileSize: file.size,
                mimeType: file.type,
            })

            setUploadProgress(100)
            if (result.success) {
                toast({
                    title: "Document uploaded",
                    description: "Document has been successfully uploaded",
                })

                // Reset form
                setFormData({
                    name: "",
                    type: "other",
                    category: "administrative",
                    description: "",
                    isRequired: false,
                })

                setIsUploadDialogOpen(false)
                onDocumentUploaded?.()
            } else {
                throw new Error(
                    "error" in result ? result.error : "Upload failed"
                )
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast({
                title: "Upload failed",
                description:
                    error instanceof Error
                        ? error.message
                        : "An error occurred while uploading",
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const handleDeleteDocument = async (documentId: string) => {
        try {
            const result = await deleteLoadDocumentAction(documentId)
            if (result.success) {
                toast({
                    title: "Document deleted",
                    description: "Document has been successfully deleted",
                })
                onDocumentUploaded?.()
            } else {
                throw new Error(
                    "error" in result ? result.error : "Delete failed"
                )
            }
        } catch (error) {
            toast({
                title: "Delete failed",
                description:
                    error instanceof Error
                        ? error.message
                        : "An error occurred while deleting",
                variant: "destructive",
            })
        }
    }

    const getDocumentTypeColor = (type: LoadDocument["type"]) => {
        const colors = {
            bol: "bg-blue-100 text-blue-800",
            pod: "bg-green-100 text-green-800",
            invoice: "bg-purple-100 text-purple-800",
            receipt: "bg-orange-100 text-orange-800",
            permit: "bg-red-100 text-red-800",
            contract: "bg-indigo-100 text-indigo-800",
            rate_confirmation: "bg-teal-100 text-teal-800",
            other: "bg-gray-100 text-gray-800",
        }
        return colors[type] || colors.other
    }

    return (
        <div className='space-y-4'>
            {/* Header with upload button */}
            <div className='flex items-center justify-between'>
                <div>
                    <h3 className='text-lg font-semibold'>Load Documents</h3>
                    <p className='text-sm text-muted-foreground'>
                        Manage documents related to this load
                    </p>
                </div>

                <Dialog
                    open={isUploadDialogOpen}
                    onOpenChange={setIsUploadDialogOpen}
                >
                    <DialogTrigger asChild>
                        <Button
                            variant='outline'
                            size='sm'
                        >
                            <Upload className='mr-2 h-4 w-4' />
                            Upload Document
                        </Button>
                    </DialogTrigger>

                    <DialogContent className='sm:max-w-md'>
                        <DialogHeader>
                            <DialogTitle>Upload Load Document</DialogTitle>
                        </DialogHeader>

                        <div className='space-y-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='name'>Document Name</Label>
                                <Input
                                    id='name'
                                    value={formData.name}
                                    onChange={e =>
                                        setFormData(prev => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder='Enter document name'
                                    disabled={isUploading}
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div className='space-y-2'>
                                    <Label htmlFor='type'>Document Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(
                                            value: LoadDocument["type"]
                                        ) =>
                                            setFormData(prev => ({
                                                ...prev,
                                                type: value,
                                            }))
                                        }
                                        disabled={isUploading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='bol'>
                                                Bill of Lading
                                            </SelectItem>
                                            <SelectItem value='pod'>
                                                Proof of Delivery
                                            </SelectItem>
                                            <SelectItem value='invoice'>
                                                Invoice
                                            </SelectItem>
                                            <SelectItem value='receipt'>
                                                Receipt
                                            </SelectItem>
                                            <SelectItem value='permit'>
                                                Permit
                                            </SelectItem>
                                            <SelectItem value='contract'>
                                                Contract
                                            </SelectItem>
                                            <SelectItem value='rate_confirmation'>
                                                Rate Confirmation
                                            </SelectItem>
                                            <SelectItem value='other'>
                                                Other
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className='space-y-2'>
                                    <Label htmlFor='category'>Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(
                                            value: LoadDocument["category"]
                                        ) =>
                                            setFormData(prev => ({
                                                ...prev,
                                                category: value,
                                            }))
                                        }
                                        disabled={isUploading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='pickup'>
                                                Pickup
                                            </SelectItem>
                                            <SelectItem value='delivery'>
                                                Delivery
                                            </SelectItem>
                                            <SelectItem value='administrative'>
                                                Administrative
                                            </SelectItem>
                                            <SelectItem value='billing'>
                                                Billing
                                            </SelectItem>
                                            <SelectItem value='compliance'>
                                                Compliance
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className='space-y-2'>
                                <Label htmlFor='description'>
                                    Description (Optional)
                                </Label>
                                <Textarea
                                    id='description'
                                    value={formData.description}
                                    onChange={e =>
                                        setFormData(prev => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder='Add a description...'
                                    rows={3}
                                    disabled={isUploading}
                                />
                            </div>

                            <div className='flex items-center space-x-2'>
                                <input
                                    type='checkbox'
                                    id='isRequired'
                                    checked={formData.isRequired}
                                    onChange={e =>
                                        setFormData(prev => ({
                                            ...prev,
                                            isRequired: e.target.checked,
                                        }))
                                    }
                                    disabled={isUploading}
                                    className='rounded border-gray-300'
                                />
                                <Label
                                    htmlFor='isRequired'
                                    className='text-sm font-normal'
                                >
                                    Mark as required document
                                </Label>
                            </div>

                            {/* File upload area */}
                            <div
                                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${
                      isUploading
                          ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                          : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }
                `}
                                onClick={
                                    isUploading ? undefined : handleFileSelect
                                }
                            >
                                {isUploading ? (
                                    <div className='space-y-2'>
                                        <div className='w-full bg-gray-200 rounded-full h-2'>
                                            <div
                                                className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                                                style={{
                                                    width: `${uploadProgress}%`,
                                                }}
                                            />
                                        </div>
                                        <p className='text-sm text-gray-600'>
                                            Uploading... {uploadProgress}%
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className='mx-auto h-8 w-8 text-gray-400' />
                                        <p className='mt-2 text-sm text-gray-600'>
                                            Click to select a file or drag and
                                            drop
                                        </p>
                                        <p className='text-xs text-gray-500'>
                                            PDF, JPG, PNG, DOC, DOCX (max 10MB)
                                        </p>
                                    </>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type='file'
                                accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                                onChange={handleFileChange}
                                className='hidden'
                                disabled={isUploading}
                            />

                            <div className='flex gap-2 justify-end'>
                                <Button
                                    variant='outline'
                                    onClick={() => setIsUploadDialogOpen(false)}
                                    disabled={isUploading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Documents list */}
            <div className='space-y-3'>
                {documents.length > 0 ? (
                    documents.map(doc => (
                        <Card
                            key={doc.id}
                            className='border-zinc-800 bg-zinc-900'
                        >
                            <CardContent className='p-4'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-3'>
                                        <FileText className='h-5 w-5 text-muted-foreground' />
                                        <div className='flex-1'>
                                            <div className='flex items-center gap-2 mb-1'>
                                                <h4 className='font-medium text-white'>
                                                    {doc.name}
                                                </h4>
                                                <Badge
                                                    className={getDocumentTypeColor(
                                                        doc.type
                                                    )}
                                                >
                                                    {doc.type.replace("_", " ")}
                                                </Badge>
                                                {doc.isRequired && (
                                                    <Badge
                                                        variant='destructive'
                                                        className='text-xs'
                                                    >
                                                        Required
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className='text-sm text-muted-foreground'>
                                                {doc.category} •{" "}
                                                {Math.round(
                                                    doc.fileSize / 1024
                                                )}{" "}
                                                KB
                                            </p>
                                            {doc.description && (
                                                <p className='text-sm text-muted-foreground mt-1'>
                                                    {doc.description}
                                                </p>
                                            )}
                                            <p className='text-xs text-muted-foreground mt-1'>
                                                Uploaded{" "}
                                                {new Date(
                                                    doc.uploadedAt
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className='flex items-center gap-2'>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={() =>
                                                window.open(doc.url, "_blank")
                                            }
                                        >
                                            <Eye className='h-4 w-4' />
                                        </Button>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={() => {
                                                const link =
                                                    window.document.createElement(
                                                        "a"
                                                    )
                                                link.href = doc.url
                                                link.download = doc.name
                                                window.document.body.appendChild(
                                                    link
                                                )
                                                link.click()
                                                window.document.body.removeChild(
                                                    link
                                                )
                                            }}
                                        >
                                            <Download className='h-4 w-4' />
                                        </Button>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={() =>
                                                handleDeleteDocument(doc.id)
                                            }
                                            className='text-red-400 hover:text-red-300 hover:bg-red-900/20'
                                        >
                                            <X className='h-4 w-4' />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className='border-zinc-800 bg-zinc-900'>
                        <CardContent className='p-6 text-center'>
                            <FileText className='mx-auto h-12 w-12 text-muted-foreground opacity-50' />
                            <h3 className='mt-4 text-lg font-medium text-white'>
                                No documents uploaded
                            </h3>
                            <p className='mt-2 text-sm text-muted-foreground'>
                                Upload documents related to this load such as
                                BOL, POD, invoices, etc.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
