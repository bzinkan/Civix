# Ordinance Documents

This directory contains regulatory ordinances and codes used by Civix for compliance determinations.

## Structure

```
/ordinances/
  /cincinnati/
    Cincinnati, OH Code of Ordinances.pdf  - Full Cincinnati municipal code (~40MB)
    full-ordinances.txt                    - Searchable text version (~8MB)
    chapter-856-extract.md                 - Chapter 856: Short Term Rentals (formatted)
```

## Cincinnati Chapter 856: Short Term Rentals

**Status**: ✅ Extracted and ready for AI use

The complete Chapter 856 includes:
- **856-1**: Definitions (Hosting Platform, Operator, Responsible Person, etc.)
- **856-3**: Applicability
- **856-5**: Registration Requirements
- **856-7**: Short Term Rental Registration
- **856-9**: Standard Conditions
- **856-11**: Registration Renewal
- **856-13**: Denial of Application
- **856-15**: Avoidance of Nuisances
- **856-17**: Limitations on Operation (the key section for our rules!)
- **856-19**: Limitations on Inspections
- **856-21**: Excise Tax
- **856-23**: Hosting Platform Obligations
- **856-25**: Suspension, Revocation, and Penalties
- **856-27**: Appeals
- **856-29**: Severability

## How AI Uses These Documents

1. **AI Conversation**: References specific sections when explaining rules to users
2. **Citations**: Provides exact ordinance text (e.g., "Section 856-17(a) states...")
3. **Context**: Understands nuances and edge cases from full legal text
4. **Verification**: Users can click through to read the source PDF

## Adding New Ordinances

1. Create jurisdiction folder (e.g., `/cincinnati/`)
2. Add PDF of full ordinance
3. Convert to text: `pdftotext "ordinance.pdf" "full-ordinances.txt"`
4. Extract key chapters to markdown files
5. Update seed script to map sections to rules
