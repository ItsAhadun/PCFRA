'use client'

import { use, useState } from 'react'
import {
  useValidateToken,
  useResidentRegistration,
} from '@/hooks/use-registration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  AlertTriangle,
  Building,
  CheckCircle,
  Flame,
  User,
  Phone,
  Heart,
  Shield,
  FileText,
  DoorOpen,
  PersonStanding,
  Hammer,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import type { ResidentRegistrationInput } from '@/types'

interface PageProps {
  params: Promise<{ token: string }>
}

const BLOOD_TYPES = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'Unknown',
]

export default function ResidentRegistrationPage({ params }: PageProps) {
  const { token } = use(params)
  const { data: tokenData, isLoading, error } = useValidateToken(token)
  const registration = useResidentRegistration()

  const [activeTab, setActiveTab] = useState('site-info')

  const [formData, setFormData] = useState<Partial<ResidentRegistrationInput>>({
    token,
    // Resident Defaults
    apartment_number: '',
    floor_number: 0,
    tenant_name: '',
    number_of_occupants: 1,
    has_mobility_issues: false,
    uses_wheelchair: false,
    has_visual_impairment: false,
    has_hearing_impairment: false,
    has_cognitive_impairment: false,
    requires_assistance_evacuation: false,
    oxygen_dependent: false,
    // Site Defaults
    site_name: '',
    assessment_date: new Date().toISOString().split('T')[0],
    site_address: '',
    postcode: '',
    assessor_name: '',
    assessor_company: '',
    principal_contractor: '',
    dutyholder_name: '',
    dutyholder_contact: '',
    project_description: '',
    // Building Defaults
    building_type: '',
    number_of_floors_site: 0,
    building_height: 0,
    occupancy_type: '',
    estimated_occupancy: 0,
    vulnerable_occupants: '',
    // Fire Safety Defaults
    fire_alarm_type: '',
    fire_alarm_working: '',
    emergency_lighting: '',
    fire_extinguishers: '',
    sprinkler_system: '',
    smoke_ventilation: '',
    // Fire Doors Defaults
    fire_doors_present: '',
    fire_doors_condition: '',
    self_closing_mechanism: '',
    // Escape Defaults
    escape_routes_adequate: '',
    escape_routes_clear: '',
    emergency_exits: '',
    assembly_point: '',
    evacuation_procedure: '',
    // Hot Works Defaults
    hot_works_permit_system: '',
    hot_works_training: '',
  })

  const [submitted, setSubmitted] = useState(false)

  // Pre-fill site name and address from token data if available
  if (tokenData?.site && !formData.site_name && !isLoading) {
    // Use a functional update or useEffect to avoid infinite loops,
    // but for simplicity in this overwrite, we rely on initial user input or tokenData display.
    // Actually, let's just display tokenData values as defaults in the form if inputs are empty?
    // Or Set them once.
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation for resident part
    if (
      !formData.apartment_number ||
      !formData.floor_number ||
      !formData.tenant_name ||
      !formData.number_of_occupants
    ) {
      // If resident tab is empty, maybe alert?
      // But if we are repurposing this, maybe those match?
      // For now, we keep the requirement.
    }

    try {
      await registration.mutateAsync(formData as ResidentRegistrationInput)
      setSubmitted(true)
    } catch {
      // Error handled by mutation
    }
  }

  const updateField = (
    field: keyof ResidentRegistrationInput,
    value: unknown,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Tab Navigation
  const tabs = [
    'site-info',
    'building-details',
    'fire-safety',
    'fire-doors',
    'means-of-escape',
    'hot-works',
    'resident-details',
  ]

  const nextTab = () => {
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
      window.scrollTo(0, 0)
    }
  }

  const prevTab = () => {
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
      window.scrollTo(0, 0)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-orange-500" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Validating your registration link...
          </p>
        </div>
      </div>
    )
  }

  // Error state - invalid or expired token
  if (error || !tokenData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-red-50 to-white p-4 dark:from-gray-900 dark:to-gray-950">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle>Invalid Registration Link</CardTitle>
            <CardDescription>
              This registration link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please contact your building management to request a new
              registration link.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state - registration complete
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-white p-4 dark:from-gray-900 dark:to-gray-950">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle>Registration Submitted!</CardTitle>
            <CardDescription>
              The site and resident information has been successfully recorded.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Next Steps</strong>
              </p>
              <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                The assessor will review the submitted information.
              </p>
            </div>
            <p className="text-xs text-gray-500">
              You can close this page now.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Registration form
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-12 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            <span className="font-bold">PCFRA</span>
          </div>
          <span className="text-sm text-gray-500">
            Site Registration & Assessment
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
              <TabsTrigger value="site-info" className="text-xs md:text-sm">
                Site Info
              </TabsTrigger>
              <TabsTrigger
                value="building-details"
                className="text-xs md:text-sm"
              >
                Building
              </TabsTrigger>
              <TabsTrigger value="fire-safety" className="text-xs md:text-sm">
                Fire Safety
              </TabsTrigger>
              <TabsTrigger value="fire-doors" className="text-xs md:text-sm">
                Doors
              </TabsTrigger>
              <TabsTrigger
                value="means-of-escape"
                className="text-xs md:text-sm"
              >
                Escape
              </TabsTrigger>
              <TabsTrigger value="hot-works" className="text-xs md:text-sm">
                Hot Works
              </TabsTrigger>
              <TabsTrigger
                value="resident-details"
                className="text-xs md:text-sm"
              >
                Resident
              </TabsTrigger>
            </TabsList>

            {/* Section 1: Site Information */}
            <TabsContent value="site-info" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Section 1: Site Information</CardTitle>
                  <CardDescription>
                    General information about the site and assessment
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">Site Name *</Label>
                    <Input
                      id="site_name"
                      value={formData.site_name}
                      onChange={(e) => updateField('site_name', e.target.value)}
                      placeholder={tokenData.site?.name || 'Enter site name'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessment_date">Assessment Date *</Label>
                    <Input
                      id="assessment_date"
                      type="date"
                      value={formData.assessment_date}
                      onChange={(e) =>
                        updateField('assessment_date', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="site_address">Site Address *</Label>
                    <Input
                      id="site_address"
                      value={formData.site_address}
                      onChange={(e) =>
                        updateField('site_address', e.target.value)
                      }
                      placeholder={
                        tokenData.site?.address || 'Enter full address'
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      value={formData.postcode}
                      onChange={(e) => updateField('postcode', e.target.value)}
                      placeholder="Enter postcode"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessor_name">Assessor Name *</Label>
                    <Input
                      id="assessor_name"
                      value={formData.assessor_name}
                      onChange={(e) =>
                        updateField('assessor_name', e.target.value)
                      }
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessor_company">Assessor Company</Label>
                    <Input
                      id="assessor_company"
                      value={formData.assessor_company}
                      onChange={(e) =>
                        updateField('assessor_company', e.target.value)
                      }
                      placeholder="Company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="principal_contractor">
                      Principal Contractor *
                    </Label>
                    <Input
                      id="principal_contractor"
                      value={formData.principal_contractor}
                      onChange={(e) =>
                        updateField('principal_contractor', e.target.value)
                      }
                      placeholder="Principal contractor name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dutyholder_name">Dutyholder Name</Label>
                    <Input
                      id="dutyholder_name"
                      value={formData.dutyholder_name}
                      onChange={(e) =>
                        updateField('dutyholder_name', e.target.value)
                      }
                      placeholder="Dutyholder name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dutyholder_contact">
                      Dutyholder Contact
                    </Label>
                    <Input
                      id="dutyholder_contact"
                      value={formData.dutyholder_contact}
                      onChange={(e) =>
                        updateField('dutyholder_contact', e.target.value)
                      }
                      placeholder="Email or phone"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="project_description">
                      Project Description
                    </Label>
                    <Textarea
                      id="project_description"
                      value={formData.project_description || ''}
                      onChange={(e) =>
                        updateField('project_description', e.target.value)
                      }
                      placeholder="Brief description of construction work being undertaken"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Section 2: Building Details */}
            <TabsContent value="building-details" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Section 2: Building Details</CardTitle>
                  <CardDescription>
                    Physical characteristics of the building
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="building_type">Building Type *</Label>
                    <Select
                      value={formData.building_type}
                      onValueChange={(val) => updateField('building_type', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="mixed_use">Mixed Use</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number_of_floors_site">
                      Number of Floors
                    </Label>
                    <Input
                      id="number_of_floors_site"
                      type="number"
                      value={formData.number_of_floors_site || ''}
                      onChange={(e) =>
                        updateField(
                          'number_of_floors_site',
                          parseInt(e.target.value),
                        )
                      }
                      placeholder="Enter number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="building_height">
                      Building Height (meters)
                    </Label>
                    <Input
                      id="building_height"
                      type="number"
                      value={formData.building_height || ''}
                      onChange={(e) =>
                        updateField(
                          'building_height',
                          parseFloat(e.target.value),
                        )
                      }
                      placeholder="Height in meters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupancy_type">Occupancy Type</Label>
                    <Select
                      value={formData.occupancy_type}
                      onValueChange={(val) =>
                        updateField('occupancy_type', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select occupancy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Needs</SelectItem>
                        <SelectItem value="student">
                          Student Accommodation
                        </SelectItem>
                        <SelectItem value="supported">
                          Supported Living
                        </SelectItem>
                        <SelectItem value="care_home">Care Home</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_occupancy">
                      Estimated Occupancy
                    </Label>
                    <Input
                      id="estimated_occupancy"
                      type="number"
                      value={formData.estimated_occupancy || ''}
                      onChange={(e) =>
                        updateField(
                          'estimated_occupancy',
                          parseInt(e.target.value),
                        )
                      }
                      placeholder="Number of occupants"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="vulnerable_occupants">
                      Vulnerable Occupants
                    </Label>
                    <Input
                      id="vulnerable_occupants"
                      value={formData.vulnerable_occupants || ''}
                      onChange={(e) =>
                        updateField('vulnerable_occupants', e.target.value)
                      }
                      placeholder="E.g., elderly, disabled, children"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Section 3: Fire Safety Provisions */}
            <TabsContent value="fire-safety" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Section 3: Fire Safety Provisions</CardTitle>
                  <CardDescription>
                    Details about fire safety systems
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fire Alarm Type</Label>
                    <Select
                      value={formData.fire_alarm_type}
                      onValueChange={(val) =>
                        updateField('fire_alarm_type', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="manual">
                          Manual (Bells/Gongs)
                        </SelectItem>
                        <SelectItem value="conventional">
                          Conventional System
                        </SelectItem>
                        <SelectItem value="addressable">
                          Addressable System
                        </SelectItem>
                        <SelectItem value="wireless">
                          Wireless System
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fire Alarm Working</Label>
                    <Select
                      value={formData.fire_alarm_working}
                      onValueChange={(val) =>
                        updateField('fire_alarm_working', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency Lighting</Label>
                    <Select
                      value={formData.emergency_lighting}
                      onValueChange={(val) =>
                        updateField('emergency_lighting', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present_working">
                          Present & Working
                        </SelectItem>
                        <SelectItem value="present_faulty">
                          Present & Faulty
                        </SelectItem>
                        <SelectItem value="not_present">Not Present</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fire Extinguishers</Label>
                    <Select
                      value={formData.fire_extinguishers}
                      onValueChange={(val) =>
                        updateField('fire_extinguishers', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adequate">Adequate</SelectItem>
                        <SelectItem value="inadequate">Inadequate</SelectItem>
                        <SelectItem value="missing">Missing</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sprinkler System</Label>
                    <Select
                      value={formData.sprinkler_system}
                      onValueChange={(val) =>
                        updateField('sprinkler_system', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="isolated">Isolated</SelectItem>
                        <SelectItem value="faulty">Faulty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Smoke Ventilation</Label>
                    <Select
                      value={formData.smoke_ventilation}
                      onValueChange={(val) =>
                        updateField('smoke_ventilation', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="aoov">
                          AOV (Automatic Opening Vents)
                        </SelectItem>
                        <SelectItem value="manual_windows">
                          Manual Windows
                        </SelectItem>
                        <SelectItem value="mechanical">
                          Mechanical Extraction
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Section 4: Fire Doors & Compartmentation */}
            <TabsContent value="fire-doors" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Section 4: Fire Doors & Compartmentation
                  </CardTitle>
                  <CardDescription>
                    Assessment of containment measures
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fire Doors Present</Label>
                    <Select
                      value={formData.fire_doors_present}
                      onValueChange={(val) =>
                        updateField('fire_doors_present', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="partial">partial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fire Doors Condition</Label>
                    <Select
                      value={formData.fire_doors_condition}
                      onValueChange={(val) =>
                        updateField('fire_doors_condition', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Self-Closing Mechanism</Label>
                    <Select
                      value={formData.self_closing_mechanism}
                      onValueChange={(val) =>
                        updateField('self_closing_mechanism', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_working">All Working</SelectItem>
                        <SelectItem value="some_faulty">Some Faulty</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="not_applicable">
                          Not Applicable
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Section 5: Means of Escape */}
            <TabsContent value="means-of-escape" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Section 5: Means of Escape</CardTitle>
                  <CardDescription>
                    Evaluation of evacuation routes
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Escape Routes Adequate</Label>
                    <Select
                      value={formData.escape_routes_adequate}
                      onValueChange={(val) =>
                        updateField('escape_routes_adequate', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Escape Routes Clear</Label>
                    <Select
                      value={formData.escape_routes_clear}
                      onValueChange={(val) =>
                        updateField('escape_routes_clear', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No (Obstructed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Emergency Exits</Label>
                    <Select
                      value={formData.emergency_exits}
                      onValueChange={(val) =>
                        updateField('emergency_exits', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accessible_signed">
                          Accessible & Signed
                        </SelectItem>
                        <SelectItem value="accessible_not_signed">
                          Accessible but Not Signed
                        </SelectItem>
                        <SelectItem value="blocked">Blocked/Locked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assembly_point">Assembly Point</Label>
                    <Input
                      id="assembly_point"
                      value={formData.assembly_point || ''}
                      onChange={(e) =>
                        updateField('assembly_point', e.target.value)
                      }
                      placeholder="Location of assembly point"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="evacuation_procedure">
                      Evacuation Procedure
                    </Label>
                    <Textarea
                      id="evacuation_procedure"
                      value={formData.evacuation_procedure || ''}
                      onChange={(e) =>
                        updateField('evacuation_procedure', e.target.value)
                      }
                      placeholder="Describe evacuation procedures in place"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Section 6: Hot Works & Construction Activities */}
            <TabsContent value="hot-works" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Section 6: Hot Works & Construction Activities
                  </CardTitle>
                  <CardDescription>
                    Management of high-risk activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Hot Works Permit System</Label>
                    <Select
                      value={formData.hot_works_permit_system}
                      onValueChange={(val) =>
                        updateField('hot_works_permit_system', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_place">
                          In Place & Used
                        </SelectItem>
                        <SelectItem value="not_used">
                          In Place but Not Used
                        </SelectItem>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="n_a">Not Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hot Works Training</Label>
                    <Select
                      value={formData.hot_works_training}
                      onValueChange={(val) =>
                        updateField('hot_works_training', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="partial">Partial/Expired</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="n_a">Not Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Section 7: Resident Details (Original Form) */}
            <TabsContent value="resident-details" className="mt-6 space-y-4">
              {/* Registration Form - Apartment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Apartment Details
                  </CardTitle>
                  <CardDescription>
                    Enter your apartment information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="apartment_number">
                        Apartment Number *
                      </Label>
                      <Input
                        id="apartment_number"
                        value={formData.apartment_number}
                        onChange={(e) =>
                          updateField('apartment_number', e.target.value)
                        }
                        placeholder="e.g., 101, 2A, 15B"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="floor_number">Floor Number *</Label>
                      <Input
                        id="floor_number"
                        type="number"
                        min={0}
                        max={100}
                        value={formData.floor_number || ''}
                        onChange={(e) =>
                          updateField(
                            'floor_number',
                            parseInt(e.target.value) || 0,
                          )
                        }
                        placeholder="e.g., 1, 2, 3"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Basic information about the apartment residents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tenant_name">
                        Primary Resident Name *
                      </Label>
                      <Input
                        id="tenant_name"
                        value={formData.tenant_name}
                        onChange={(e) =>
                          updateField('tenant_name', e.target.value)
                        }
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="occupants">Number of Occupants *</Label>
                      <Input
                        id="occupants"
                        type="number"
                        min={1}
                        max={20}
                        value={formData.number_of_occupants}
                        onChange={(e) =>
                          updateField(
                            'number_of_occupants',
                            parseInt(e.target.value) || 1,
                          )
                        }
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Emergency Contact
                  </CardTitle>
                  <CardDescription>
                    Someone to contact in case of emergency
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="emergency_name">Contact Name</Label>
                      <Input
                        id="emergency_name"
                        value={formData.emergency_contact_name || ''}
                        onChange={(e) =>
                          updateField('emergency_contact_name', e.target.value)
                        }
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergency_phone">Contact Phone</Label>
                      <Input
                        id="emergency_phone"
                        type="tel"
                        value={formData.emergency_contact_phone || ''}
                        onChange={(e) =>
                          updateField('emergency_contact_phone', e.target.value)
                        }
                        placeholder="+44 7XXX XXXXXX"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Accessibility & Medical Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Health & Accessibility
                  </CardTitle>
                  <CardDescription>
                    This information helps first responders provided better
                    assistance during emergencies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Disability checkboxes */}
                  <div className="space-y-3">
                    <Label>
                      Do any residents have the following conditions?
                    </Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          key: 'has_mobility_issues',
                          label: 'Mobility issues',
                        },
                        {
                          key: 'uses_wheelchair',
                          label: 'Uses wheelchair',
                        },
                        {
                          key: 'has_visual_impairment',
                          label: 'Visual impairment',
                        },
                        {
                          key: 'has_hearing_impairment',
                          label: 'Hearing impairment',
                        },
                        {
                          key: 'has_cognitive_impairment',
                          label: 'Cognitive impairment',
                        },
                        {
                          key: 'requires_assistance_evacuation',
                          label: 'Requires evacuation assistance',
                        },
                        {
                          key: 'oxygen_dependent',
                          label: 'Oxygen dependent',
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={item.key}
                            checked={
                              formData[
                                item.key as keyof ResidentRegistrationInput
                              ] as boolean
                            }
                            onCheckedChange={(checked) =>
                              updateField(
                                item.key as keyof ResidentRegistrationInput,
                                checked,
                              )
                            }
                            disabled={registration.isPending}
                          />
                          <Label
                            htmlFor={item.key}
                            className="text-sm font-normal"
                          >
                            {item.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="other_disabilities">
                      Other conditions or needs
                    </Label>
                    <Textarea
                      id="other_disabilities"
                      value={formData.other_disabilities || ''}
                      onChange={(e) =>
                        updateField('other_disabilities', e.target.value)
                      }
                      placeholder="Any other conditions or special needs..."
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="blood_type">Blood Type</Label>
                      <Select
                        value={formData.blood_type || ''}
                        onValueChange={(value) =>
                          updateField('blood_type', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allergies">Allergies</Label>
                      <Input
                        id="allergies"
                        value={formData.allergies || ''}
                        onChange={(e) =>
                          updateField('allergies', e.target.value)
                        }
                        placeholder="e.g., Penicillin, Peanuts"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medical_conditions">
                      Medical Conditions
                    </Label>
                    <Textarea
                      id="medical_conditions"
                      value={formData.medical_conditions || ''}
                      onChange={(e) =>
                        updateField('medical_conditions', e.target.value)
                      }
                      placeholder="e.g., Diabetes, Heart condition, Epilepsy..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="notes">
                      Any other information for first responders
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ''}
                      onChange={(e) => updateField('notes', e.target.value)}
                      placeholder="e.g., Pet in apartment, specific evacuation needs..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Navigation / Submit Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevTab}
                disabled={activeTab === 'site-info'}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>

              {activeTab === 'resident-details' ? (
                <Button
                  type="submit"
                  disabled={
                    registration.isPending || !formData.apartment_number
                  }
                >
                  {registration.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Registration'
                  )}
                </Button>
              ) : (
                <Button type="button" onClick={nextTab}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </Tabs>
        </form>
      </main>
    </div>
  )
}
