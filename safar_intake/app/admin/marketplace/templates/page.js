'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Plus,
  Search,
  Mail,
  MessageCircle,
  Edit,
  Copy,
  Trash2,
  Eye,
  Power,
  X,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

const TEMPLATE_CATEGORIES = {
  welcome: 'Welcome',
  listing: 'Listing Management',
  booking: 'Booking',
  partnership: 'Partnership',
  account: 'Account',
  follow_up: 'Follow-up'
};

const AVAILABLE_VARIABLES = [
  '{{host_name}}',
  '{{business_name}}',
  '{{listing_title}}',
  '{{booking_id}}',
  '{{customer_name}}',
  '{{city}}',
  '{{website_name}}',
  '{{date}}',
  '{{time}}'
];

function TemplatesInner() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    type: 'email',
    subject: '',
    body: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        category: filterCategory,
        type: filterType
      });
      const res = await fetch(`/api/marketplace/templates?${params}`);
      const data = await res.json();
      
      if (data.ok) {
        setTemplates(data.templates || []);
      } else {
        toast.error('Failed to load templates');
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadTemplates();
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: '',
      type: 'email',
      subject: '',
      body: ''
    });
    setShowEditor(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      type: template.type,
      subject: template.subject || '',
      body: template.body
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category || !formData.body) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.type === 'email' && !formData.subject) {
      toast.error('Email templates require a subject');
      return;
    }

    try {
      const url = editingTemplate 
        ? `/api/marketplace/templates/${editingTemplate.id}`
        : '/api/marketplace/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (data.ok) {
        toast.success(editingTemplate ? 'Template updated' : 'Template created');
        setShowEditor(false);
        loadTemplates();
      } else {
        toast.error(data.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDuplicate = async (template) => {
    try {
      const res = await fetch(`/api/marketplace/templates/${template.id}/duplicate`, {
        method: 'POST'
      });

      const data = await res.json();
      
      if (data.ok) {
        toast.success('Template duplicated');
        loadTemplates();
      } else {
        toast.error(data.error || 'Failed to duplicate template');
      }
    } catch (error) {
      console.error('Duplicate error:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleDelete = async (template) => {
    if (!confirm(`Delete template "${template.name}"?`)) return;

    try {
      const res = await fetch(`/api/marketplace/templates/${template.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      
      if (data.ok) {
        toast.success('Template deleted');
        loadTemplates();
      } else {
        toast.error(data.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleToggleEnabled = async (template) => {
    try {
      const res = await fetch(`/api/marketplace/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !template.enabled })
      });

      const data = await res.json();
      
      if (data.ok) {
        toast.success(template.enabled ? 'Template disabled' : 'Template enabled');
        loadTemplates();
      } else {
        toast.error(data.error || 'Failed to update template');
      }
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Failed to update template');
    }
  };

  const handlePreview = async (template) => {
    try {
      const res = await fetch(`/api/marketplace/templates/${template.id}/preview`, {
        method: 'POST'
      });

      const data = await res.json();
      
      if (data.ok) {
        setPreview(data.preview);
        setShowPreview(true);
      } else {
        toast.error('Failed to generate preview');
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to generate preview');
    }
  };

  const insertVariable = (variable) => {
    setFormData({
      ...formData,
      body: formData.body + ' ' + variable
    });
  };

  const emailTemplates = templates.filter(t => t.type === 'email');
  const whatsappTemplates = templates.filter(t => t.type === 'whatsapp');

  return (
    <div className="min-h-screen bg-secondary/20 pt-20 lg:pt-24">
      <Navbar />
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/marketplace">
            <Button variant="ghost" className="rounded-full mb-4">
              <ArrowLeft className="size-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold">Communication Templates</h1>
              <p className="text-muted-foreground mt-1">
                Manage email and WhatsApp message templates
              </p>
            </div>
            <Button onClick={handleCreate} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
              <Plus className="size-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="rounded-3xl border bg-white p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 rounded-full"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setTimeout(loadTemplates, 100); }}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setTimeout(loadTemplates, 100); }}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Templates */}
          <div className="rounded-3xl border bg-white p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-full bg-blue-50 grid place-items-center">
                <Mail className="size-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Email Templates</h2>
                <p className="text-sm text-muted-foreground">{emailTemplates.length} templates</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald2"></div>
              </div>
            ) : emailTemplates.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No email templates yet</p>
                <Button onClick={handleCreate} size="sm" className="mt-4 rounded-full">
                  Create First Template
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {emailTemplates.map(template => (
                  <div key={template.id} className="p-4 rounded-xl border hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{template.name}</h3>
                          {!template.enabled && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          {TEMPLATE_CATEGORIES[template.category] || template.category}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {template.subject}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePreview(template)}
                          className="size-8 p-0"
                          title="Preview"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(template)}
                          className="size-8 p-0"
                          title="Edit"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicate(template)}
                          className="size-8 p-0"
                          title="Duplicate"
                        >
                          <Copy className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleEnabled(template)}
                          className="size-8 p-0"
                          title={template.enabled ? 'Disable' : 'Enable'}
                        >
                          <Power className={`size-4 ${template.enabled ? 'text-emerald-600' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(template)}
                          className="size-8 p-0 text-rose-600 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp Templates */}
          <div className="rounded-3xl border bg-white p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-full bg-green-50 grid place-items-center">
                <MessageCircle className="size-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">WhatsApp Templates</h2>
                <p className="text-sm text-muted-foreground">{whatsappTemplates.length} templates</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald2"></div>
              </div>
            ) : whatsappTemplates.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No WhatsApp templates yet</p>
                <Button onClick={handleCreate} size="sm" className="mt-4 rounded-full">
                  Create First Template
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {whatsappTemplates.map(template => (
                  <div key={template.id} className="p-4 rounded-xl border hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{template.name}</h3>
                          {!template.enabled && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          {TEMPLATE_CATEGORIES[template.category] || template.category}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {template.body.substring(0, 100)}...
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePreview(template)}
                          className="size-8 p-0"
                          title="Preview"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(template)}
                          className="size-8 p-0"
                          title="Edit"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicate(template)}
                          className="size-8 p-0"
                          title="Duplicate"
                        >
                          <Copy className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleEnabled(template)}
                          className="size-8 p-0"
                          title={template.enabled ? 'Disable' : 'Enable'}
                        >
                          <Power className={`size-4 ${template.enabled ? 'text-emerald-600' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(template)}
                          className="size-8 p-0 text-rose-600 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Template Name *</label>
                <Input
                  placeholder="Welcome Email"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-2 block">Type *</label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({...formData, type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Category *</label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({...formData, category: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'email' && (
              <div>
                <label className="text-sm font-semibold mb-2 block">Subject *</label>
                <Input
                  placeholder="Welcome to {{website_name}}!"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-semibold mb-2 block">Message Body *</label>
              <Textarea
                placeholder="Hello {{customer_name}},&#10;&#10;Welcome to {{website_name}}!..."
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                rows={10}
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Available Variables</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_VARIABLES.map(variable => (
                  <button
                    key={variable}
                    onClick={() => insertVariable(variable)}
                    className="px-3 py-1 rounded-full bg-secondary hover:bg-secondary/80 text-xs font-mono"
                  >
                    {variable}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="rounded-full bg-emerald2 hover:bg-emerald2-deep flex-1">
                <Save className="size-4 mr-2" />
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
              <Button 
                onClick={() => setShowEditor(false)} 
                variant="outline" 
                className="rounded-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          
          {preview && (
            <div className="space-y-4 mt-4">
              {preview.subject && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Subject</label>
                  <div className="p-3 rounded-xl bg-secondary/20">
                    {preview.subject}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-semibold mb-2 block">Message</label>
                <div className="p-4 rounded-xl bg-secondary/20 whitespace-pre-wrap">
                  {preview.body}
                </div>
              </div>

              <Button 
                onClick={() => setShowPreview(false)} 
                className="rounded-full w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <ProtectedRoute requireRole="super_admin">
      <TemplatesInner />
    </ProtectedRoute>
  );
}
