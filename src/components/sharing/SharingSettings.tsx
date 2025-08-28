import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, UserShareSettings } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Share2, 
  Copy, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  ExternalLink,
  Loader2,
  CheckCircle2,
  Globe
} from 'lucide-react'

export function SharingSettings() {
  const { user } = useAuth()
  const [shareSettings, setShareSettings] = useState<UserShareSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [shareName, setShareName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (user) {
      loadShareSettings()
    }
  }, [user])

  const loadShareSettings = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_share_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      if (data) {
        setShareSettings(data)
        setShareName(data.share_name || '')
      }
    } catch (error: any) {
      console.error('Error loading share settings:', error)
      setError('Failed to load sharing settings')
    } finally {
      setLoading(false)
    }
  }

  const createOrUpdateShareSettings = async (isPublic: boolean) => {
    if (!user) return
    
    setUpdating(true)
    setError('')
    setSuccess('')
    
    try {
      const updates = {
        user_id: user.id,
        is_public: isPublic,
        share_name: shareName.trim() || null,
        updated_at: new Date().toISOString()
      }
      
      if (shareSettings) {
        // Update existing
        const { data, error } = await supabase
          .from('user_share_settings')
          .update(updates)
          .eq('id', shareSettings.id)
          .select()
          .single()
        
        if (error) throw error
        setShareSettings(data)
      } else {
        // Create new
        const { data, error } = await supabase
          .from('user_share_settings')
          .insert(updates)
          .select()
          .single()
        
        if (error) throw error
        setShareSettings(data)
      }
      
      setSuccess(isPublic ? 'Sharing enabled successfully!' : 'Sharing disabled successfully!')
    } catch (error: any) {
      console.error('Error updating share settings:', error)
      setError('Failed to update sharing settings')
    } finally {
      setUpdating(false)
    }
  }

  const generateNewToken = async () => {
    if (!user || !shareSettings) return
    
    setUpdating(true)
    setError('')
    setSuccess('')
    
    try {
      // Generate new share token by updating the record
      const { data, error } = await supabase
        .from('user_share_settings')
        .update({
          share_token: null, // This will trigger a new token generation
          updated_at: new Date().toISOString()
        })
        .eq('id', shareSettings.id)
        .select()
        .single()
      
      if (error) throw error
      setShareSettings(data)
      setSuccess('New sharing link generated!')
    } catch (error: any) {
      console.error('Error generating new token:', error)
      setError('Failed to generate new sharing link')
    } finally {
      setUpdating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getPublicUrl = () => {
    if (!shareSettings?.share_token) return ''
    return `${window.location.origin}/shared/${shareSettings.share_token}`
  }

  const openPublicPage = () => {
    const url = getPublicUrl()
    if (url) {
      window.open(url, '_blank')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading sharing settings...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Sharing Settings
          </CardTitle>
          <p className="text-sm text-gray-600">
            Share your habit tracking progress with friends and family
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="shareName">Public Display Name (optional)</Label>
            <Input
              id="shareName"
              placeholder="How should your name appear on your public page?"
              value={shareName}
              onChange={(e) => setShareName(e.target.value)}
              className="focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-xs text-gray-600">
              If left empty, your profile name will be used
            </p>
          </div>

          {/* Sharing Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {shareSettings?.is_public ? (
                <Eye className="h-5 w-5 text-green-600" />
              ) : (
                <EyeOff className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">
                  Sharing is {shareSettings?.is_public ? 'enabled' : 'disabled'}
                </p>
                <p className="text-sm text-gray-600">
                  {shareSettings?.is_public 
                    ? 'Your habits are publicly viewable via the sharing link'
                    : 'Your habits are private and not shared'
                  }
                </p>
              </div>
            </div>
            
            <Badge variant={shareSettings?.is_public ? 'default' : 'secondary'}>
              {shareSettings?.is_public ? 'Public' : 'Private'}
            </Badge>
          </div>

          {/* Public URL */}
          {shareSettings?.is_public && shareSettings.share_token && (
            <div className="space-y-3">
              <Label>Your Public Sharing Link</Label>
              <div className="flex gap-2">
                <Input
                  value={getPublicUrl()}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(getPublicUrl())}
                  className="px-3"
                >
                  {copySuccess ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openPublicPage}
                  className="px-3"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                Anyone with this link can view your habit tracking progress
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {shareSettings?.is_public ? (
              <>
                <Button
                  onClick={() => createOrUpdateShareSettings(false)}
                  disabled={updating}
                  variant="outline"
                  className="flex-1"
                >
                  {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <EyeOff className="mr-2 h-4 w-4" />
                  Disable Sharing
                </Button>
                
                {shareSettings.share_token && (
                  <Button
                    onClick={generateNewToken}
                    disabled={updating}
                    variant="outline"
                  >
                    {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <RefreshCw className="mr-2 h-4 w-4" />
                    New Link
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={() => createOrUpdateShareSettings(true)}
                disabled={updating}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Globe className="mr-2 h-4 w-4" />
                Enable Sharing
              </Button>
            )}
            
            {shareSettings && (
              <Button
                onClick={() => createOrUpdateShareSettings(shareSettings.is_public)}
                disabled={updating}
                variant="outline"
              >
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">What gets shared?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your habit names and descriptions</li>
              <li>• Your completion history and streaks</li>
              <li>• Your overall progress statistics</li>
              <li>• Your public display name (if set)</li>
            </ul>
            <p className="text-xs text-blue-700 mt-2">
              Personal information like email and private notes are never shared.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}