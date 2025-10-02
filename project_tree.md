```
family-health-keeper/
├── backend/
│   ├── .env.example                    # Environment variables template
│   ├── .env                            # Local environment variables (gitignored)
│   ├── pyproject.toml                  # uv project configuration
│   ├── uv.lock                         # uv lock file
│   ├── .python-version                 # Python version (3.11 or 3.12)
│   │
│   ├── alembic/                        # Database migrations
│   │   ├── versions/                   # Migration scripts
│   │   │   └── 001_initial_schema.py
│   │   ├── env.py                      # Alembic environment
│   │   └── script.py.mako              # Migration template
│   │
│   ├── alembic.ini                     # Alembic configuration
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI application entry point
│   │   ├── config.py                   # Configuration management
│   │   ├── dependencies.py             # Dependency injection
│   │   │
│   │   ├── api/                        # API layer
│   │   │   ├── __init__.py
│   │   │   ├── deps.py                 # API dependencies (DB session, auth)
│   │   │   └── v1/                     # API version 1
│   │   │       ├── __init__.py
│   │   │       ├── router.py           # Main API router
│   │   │       └── endpoints/
│   │   │           ├── __init__.py
│   │   │           ├── auth.py         # Authentication endpoints
│   │   │           ├── users.py        # User/family member management
│   │   │           ├── health_records.py  # Health records CRUD
│   │   │           ├── medical_history.py # Medical history
│   │   │           ├── medications.py     # Medication tracking
│   │   │           ├── appointments.py    # Doctor appointments
│   │   │           ├── documents.py       # Medical documents upload
│   │   │           ├── reports.py         # Health reports/analytics
│   │   │           └── ai.py              # Google GenAI integration
│   │   │
│   │   ├── core/                       # Core functionality
│   │   │   ├── __init__.py
│   │   │   ├── security.py             # JWT, password hashing
│   │   │   ├── config.py               # Core configuration
│   │   │   └── logging.py              # Logging setup
│   │   │
│   │   ├── db/                         # Database layer
│   │   │   ├── __init__.py
│   │   │   ├── base.py                 # Base model class
│   │   │   ├── session.py              # Database session management
│   │   │   └── init_db.py              # Database initialization
│   │   │
│   │   ├── models/                     # SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   ├── user.py                 # User model
│   │   │   ├── family_member.py        # Family member model
│   │   │   ├── health_record.py        # Health records
│   │   │   ├── medical_history.py      # Medical history entries
│   │   │   ├── medication.py           # Medications
│   │   │   ├── appointment.py          # Appointments
│   │   │   ├── document.py             # Medical documents
│   │   │   └── vital_signs.py          # Vital signs (BP, temp, etc.)
│   │   │
│   │   ├── schemas/                    # Pydantic schemas
│   │   │   ├── __init__.py
│   │   │   ├── user.py                 # User schemas
│   │   │   ├── family_member.py        # Family member schemas
│   │   │   ├── health_record.py        # Health record schemas
│   │   │   ├── medical_history.py      # Medical history schemas
│   │   │   ├── medication.py           # Medication schemas
│   │   │   ├── appointment.py          # Appointment schemas
│   │   │   ├── document.py             # Document schemas
│   │   │   ├── vital_signs.py          # Vital signs schemas
│   │   │   ├── token.py                # Token schemas
│   │   │   └── response.py             # Common response schemas
│   │   │
│   │   ├── crud/                       # CRUD operations
│   │   │   ├── __init__.py
│   │   │   ├── base.py                 # Base CRUD class
│   │   │   ├── user.py                 # User CRUD
│   │   │   ├── family_member.py        # Family member CRUD
│   │   │   ├── health_record.py        # Health records CRUD
│   │   │   ├── medical_history.py      # Medical history CRUD
│   │   │   ├── medication.py           # Medication CRUD
│   │   │   ├── appointment.py          # Appointment CRUD
│   │   │   └── document.py             # Document CRUD
│   │   │
│   │   ├── services/                   # Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py         # Authentication service
│   │   │   ├── user_service.py         # User management service
│   │   │   ├── health_service.py       # Health records service
│   │   │   ├── ai_service.py           # Google GenAI integration
│   │   │   ├── notification_service.py # Reminders/notifications
│   │   │   ├── report_service.py       # Report generation
│   │   │   └── storage_service.py      # File storage service
│   │   │
│   │   ├── middleware/                 # Custom middleware
│   │   │   ├── __init__.py
│   │   │   ├── cors.py                 # CORS middleware
│   │   │   ├── error_handler.py        # Error handling
│   │   │   └── logging.py              # Request logging
│   │   │
│   │   └── utils/                      # Utility functions
│   │       ├── __init__.py
│   │       ├── email.py                # Email utilities
│   │       ├── validators.py           # Custom validators
│   │       ├── date_utils.py           # Date/time utilities
│   │       └── file_utils.py           # File handling utilities
│   │
│   ├── tests/                          # Backend tests
│   │   ├── __init__.py
│   │   ├── conftest.py                 # Pytest fixtures
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── test_auth.py
│   │   │       ├── test_users.py
│   │   │       ├── test_health_records.py
│   │   │       └── test_ai.py
│   │   ├── crud/
│   │   │   └── test_health_record.py
│   │   └── services/
│   │       └── test_ai_service.py
│   │
│   ├── uploads/                        # File uploads directory (gitignored)
│   │   └── .gitkeep
│   │
│   └── scripts/                        # Utility scripts
│       ├── create_superuser.py         # Create admin user
│       └── seed_db.py                  # Seed database with test data
│
├── frontend/
│   ├── .env.example                    # Frontend environment variables
│   ├── .env.local                      # Local environment (gitignored)
│   ├── package.json                    # Your existing package.json
│   ├── package-lock.json
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── tsconfig.node.json              # Node TypeScript config
│   ├── vite.config.ts                  # Vite configuration
│   ├── index.html                      # Entry HTML
│   │
│   ├── public/                         # Static assets
│   │   ├── favicon.ico
│   │   └── logo.svg
│   │
│   └── src/
│       ├── main.tsx                    # Application entry point
│       ├── App.tsx                     # Root component
│       ├── vite-env.d.ts               # Vite type definitions
│       │
│       ├── api/                        # API client layer
│       │   ├── axios.ts                # Axios instance configuration
│       │   ├── auth.api.ts             # Auth API calls
│       │   ├── users.api.ts            # Users API calls
│       │   ├── familyMembers.api.ts    # Family members API
│       │   ├── healthRecords.api.ts    # Health records API
│       │   ├── medications.api.ts      # Medications API
│       │   ├── appointments.api.ts     # Appointments API
│       │   ├── documents.api.ts        # Documents API
│       │   └── ai.api.ts               # AI/GenAI API calls
│       │
│       ├── types/                      # TypeScript type definitions
│       │   ├── index.ts
│       │   ├── user.types.ts           # User types
│       │   ├── familyMember.types.ts   # Family member types
│       │   ├── healthRecord.types.ts   # Health record types
│       │   ├── medication.types.ts     # Medication types
│       │   ├── appointment.types.ts    # Appointment types
│       │   ├── document.types.ts       # Document types
│       │   ├── vitalSigns.types.ts     # Vital signs types
│       │   └── api.types.ts            # API response types
│       │
│       ├── components/                 # Reusable components
│       │   ├── common/                 # Common UI components
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Select.tsx
│       │   │   ├── DatePicker.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Table.tsx
│       │   │   ├── LoadingSpinner.tsx
│       │   │   └── VirtualList.tsx     # Using react-window
│       │   ├── layout/                 # Layout components
│       │   │   ├── Header.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Footer.tsx
│       │   │   └── Layout.tsx
│       │   └── features/               # Feature-specific components
│       │       ├── auth/
│       │       │   ├── LoginForm.tsx
│       │       │   └── RegisterForm.tsx
│       │       ├── family/
│       │       │   ├── FamilyMemberCard.tsx
│       │       │   ├── FamilyMemberList.tsx
│       │       │   ├── AddMemberModal.tsx
│       │       │   └── MemberSelector.tsx
│       │       ├── health/
│       │       │   ├── HealthRecordForm.tsx
│       │       │   ├── HealthRecordCard.tsx
│       │       │   ├── HealthRecordList.tsx  # With react-window
│       │       │   ├── VitalSignsChart.tsx
│       │       │   └── MedicalHistoryTimeline.tsx
│       │       ├── medications/
│       │       │   ├── MedicationCard.tsx
│       │       │   ├── MedicationList.tsx
│       │       │   ├── MedicationForm.tsx
│       │       │   └── MedicationReminder.tsx
│       │       ├── appointments/
│       │       │   ├── AppointmentCard.tsx
│       │       │   ├── AppointmentList.tsx
│       │       │   ├── AppointmentForm.tsx
│       │       │   └── AppointmentCalendar.tsx
│       │       ├── documents/
│       │       │   ├── DocumentUpload.tsx
│       │       │   ├── DocumentCard.tsx
│       │       │   ├── DocumentList.tsx
│       │       │   └── DocumentViewer.tsx
│       │       └── ai/
│       │           ├── AIAssistant.tsx
│       │           ├── HealthInsights.tsx
│       │           ├── SymptomChecker.tsx
│       │           └── ChatInterface.tsx
│       │
│       ├── pages/                      # Page components
│       │   ├── Home.tsx
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   ├── Dashboard.tsx
│       │   ├── FamilyMembers.tsx
│       │   ├── HealthRecords.tsx
│       │   ├── Medications.tsx
│       │   ├── Appointments.tsx
│       │   ├── Documents.tsx
│       │   ├── Reports.tsx
│       │   ├── Profile.tsx
│       │   ├── Settings.tsx
│       │   └── NotFound.tsx
│       │
│       ├── hooks/                      # Custom React hooks
│       │   ├── useAuth.ts              # Authentication hook
│       │   ├── useApi.ts               # API call hook
│       │   ├── useLocalStorage.ts      # Local storage hook
│       │   ├── useFamilyMembers.ts     # Family members data hook
│       │   ├── useHealthRecords.ts     # Health records data hook
│       │   ├── useMedications.ts       # Medications data hook
│       │   ├── useVirtualList.ts       # Virtual list hook
│       │   └── useInfiniteScroll.ts    # Infinite scroll hook
│       │
│       ├── store/                      # Zustand state management
│       │   ├── index.ts                # Store configuration
│       │   ├── authStore.ts            # Auth state
│       │   ├── userStore.ts            # User state
│       │   ├── familyStore.ts          # Family members state
│       │   ├── healthStore.ts          # Health records state
│       │   ├── medicationStore.ts      # Medications state
│       │   ├── appointmentStore.ts     # Appointments state
│       │   └── uiStore.ts              # UI state (modals, notifications)
│       │
│       ├── routes/                     # Routing configuration
│       │   ├── index.tsx               # Routes definition
│       │   ├── ProtectedRoute.tsx      # Protected route component
│       │   └── PublicRoute.tsx         # Public route component
│       │
│       ├── utils/                      # Utility functions
│       │   ├── validators.ts           # Form validators
│       │   ├── formatters.ts           # Data formatters (dates, etc.)
│       │   ├── constants.ts            # App constants
│       │   ├── dateUtils.ts            # Date utilities
│       │   └── healthUtils.ts          # Health-specific utilities
│       │
│       ├── styles/                     # Global styles
│       │   ├── index.css               # Main stylesheet
│       │   ├── variables.css           # CSS variables
│       │   └── themes.css              # Theme definitions
│       │
│       └── assets/                     # Images, icons, fonts
│           ├── images/
│           ├── icons/
│           └── fonts/
│
├── .gitignore                          # Git ignore file
├── .dockerignore                       # Docker ignore file
├── docker-compose.yml                  # Docker Compose configuration
├── Dockerfile.backend                  # Backend Docker image
├── Dockerfile.frontend                 # Frontend Docker image
├── Makefile                            # Common commands
└── README.md                           # Project documentation
```

