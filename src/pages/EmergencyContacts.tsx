import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Phone, 
  MessageSquare, 
  Edit, 
  Trash2, 
  ArrowLeft,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import BottomNavigation from '@/components/ui/BottomNavigation';

interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

const EmergencyContacts = () => {
  const navigate = useNavigate();
  const { userProfile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [newContact, setNewContact] = useState<EmergencyContact>({
    name: '',
    phone: '',
    relationship: ''
  });

  useEffect(() => {
    if (userProfile?.emergency_contacts) {
      const parsedContacts = Array.isArray(userProfile.emergency_contacts) 
        ? userProfile.emergency_contacts 
        : [];
      setContacts(parsedContacts);
    }
  }, [userProfile]);

  const saveContacts = async (updatedContacts: EmergencyContact[]) => {
    try {
      await updateProfile({ emergency_contacts: updatedContacts });
      setContacts(updatedContacts);
      toast({
        title: "Contacts Updated",
        description: "Your emergency contacts have been saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contacts",
        variant: "destructive"
      });
    }
  };

  const addContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const updatedContacts = [...contacts, newContact];
    await saveContacts(updatedContacts);
    
    setNewContact({ name: '', phone: '', relationship: '' });
    setIsAddDialogOpen(false);
  };

  const updateContact = async () => {
    if (!editingContact || !editingContact.name || !editingContact.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const updatedContacts = contacts.map(contact => 
      contact === editingContact ? editingContact : contact
    );
    await saveContacts(updatedContacts);
    setEditingContact(null);
  };

  const deleteContact = async (contactToDelete: EmergencyContact) => {
    const updatedContacts = contacts.filter(contact => contact !== contactToDelete);
    await saveContacts(updatedContacts);
  };

  const callContact = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`);
  };

  const smsContact = (phoneNumber: string) => {
    window.open(`sms:${phoneNumber}`);
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-safe rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Emergency Contacts</h1>
                <p className="text-sm text-muted-foreground">Manage your emergency contacts</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Add Contact Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gradient-trust hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Add Emergency Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Emergency Contact</DialogTitle>
              <DialogDescription>
                Add someone who should be contacted in case of emergency
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship</Label>
                <Select 
                  value={newContact.relationship} 
                  onValueChange={(value) => setNewContact(prev => ({ ...prev, relationship: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="colleague">Colleague</SelectItem>
                    <SelectItem value="neighbor">Neighbor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-trust hover:opacity-90"
                  onClick={addContact}
                >
                  Add Contact
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Contacts List */}
        {contacts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Emergency Contacts</h3>
              <p className="text-muted-foreground mb-4">
                Add emergency contacts who will be notified when you trigger an SOS alert
              </p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-trust hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact, index) => (
              <Card key={index} className="shadow-elegant">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-safe rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{contact.name}</h3>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        {contact.relationship && (
                          <p className="text-xs text-muted-foreground capitalize">
                            {contact.relationship}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => callContact(contact.phone)}
                        className="text-safe hover:text-safe-foreground hover:bg-safe/20"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => smsContact(contact.phone)}
                        className="text-trust hover:text-trust-foreground hover:bg-trust/20"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingContact(contact)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteContact(contact)}
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Contact Dialog */}
        {editingContact && (
          <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Contact</DialogTitle>
                <DialogDescription>
                  Update the contact information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingContact.name}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number *</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editingContact.phone}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-relationship">Relationship</Label>
                  <Select 
                    value={editingContact.relationship || ''} 
                    onValueChange={(value) => setEditingContact(prev => prev ? { ...prev, relationship: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="colleague">Colleague</SelectItem>
                      <SelectItem value="neighbor">Neighbor</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setEditingContact(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-trust hover:opacity-90"
                    onClick={updateContact}
                  >
                    Update Contact
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default EmergencyContacts;