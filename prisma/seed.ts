import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const jurisdiction =
    (await prisma.jurisdiction.findFirst({
      where: { name: "Cincinnati", state: "OH" }
    })) ??
    (await prisma.jurisdiction.create({
      data: {
        name: "Cincinnati",
        state: "OH",
        type: "city"
      }
    }));

  const category =
    (await prisma.ruleCategory.findFirst({
      where: { slug: "housing-property", jurisdictionId: jurisdiction.id }
    })) ??
    (await prisma.ruleCategory.create({
      data: {
        name: "Housing & Property",
        slug: "housing-property",
        jurisdictionId: jurisdiction.id
      }
    }));

  const subcategory =
    (await prisma.ruleSubcategory.findFirst({
      where: { slug: "short-term-rentals", categoryId: category.id }
    })) ??
    (await prisma.ruleSubcategory.create({
      data: {
        name: "Short-Term Rentals",
        slug: "short-term-rentals",
        categoryId: category.id
      }
    }));

  const flow =
    (await prisma.decisionFlow.findFirst({
      where: { name: "Short-Term Rental Registration", jurisdictionId: jurisdiction.id }
    })) ??
    (await prisma.decisionFlow.create({
      data: {
        name: "Short-Term Rental Registration",
        label: "STR Eligibility Check",
        description:
          "Determine whether your property qualifies for short-term rental registration under Cincinnati Chapter 856.",
        jurisdictionId: jurisdiction.id
      }
    }));

  const questions = [
    {
      key: "property_address",
      prompt: "What is the property address you want to operate as a short-term rental?",
      type: "text",
      order: 1,
      required: true,
      helpText: "Full street address in Cincinnati, OH"
    },
    {
      key: "legal_authority",
      prompt: "Do you have legal authority to operate the property as a short-term rental?",
      type: "boolean",
      order: 2,
      required: true,
      helpText: "You must be the property owner or have written authorization from the owner."
    },
    {
      key: "affordable_housing",
      prompt: "Is the property deed-restricted or rent-restricted affordable housing?",
      type: "boolean",
      order: 3,
      required: true,
      helpText: "Properties with affordability restrictions cannot be used as short-term rentals per Section 856-17(a)."
    },
    {
      key: "total_dwelling_units",
      prompt: "How many total dwelling units are in the building?",
      type: "number",
      order: 4,
      required: true,
      helpText: "Total number of residential units in the entire building"
    },
    {
      key: "current_str_units",
      prompt: "How many short-term rental units are currently operating in the building?",
      type: "number",
      order: 5,
      required: true,
      helpText: "Count all currently registered STRs in the building, excluding your proposed unit"
    },
    {
      key: "pre_2019_operation",
      prompt: "Was this unit operating as a short-term rental before January 1, 2019?",
      type: "boolean",
      order: 6,
      required: true,
      helpText: "Grandfathered units may have different limits per Section 856-17(b)(3)."
    },
    {
      key: "pre_2019_str_count",
      prompt: "How many STR units were operating in the building before January 1, 2019?",
      type: "number",
      order: 7,
      required: false,
      helpText: "Only answer if you indicated pre-2019 operation"
    },
    {
      key: "liability_insurance",
      prompt: "Do you have commercial general liability insurance of at least $500,000?",
      type: "boolean",
      order: 8,
      required: true,
      helpText: "Required per Section 856-9(a) - must be maintained throughout registration"
    },
    {
      key: "current_taxes_utilities",
      prompt: "Are you current on all property taxes, utility bills, and special assessments?",
      type: "boolean",
      order: 9,
      required: true,
      helpText: "Required certification per Section 856-7(d)(5)"
    },
    {
      key: "code_compliance",
      prompt: "Is the property in compliance with all applicable building, housing, fire, and zoning codes?",
      type: "boolean",
      order: 10,
      required: true,
      helpText: "Required certification per Section 856-7(d)(6)"
    }
  ];

  for (const question of questions) {
    await prisma.question.upsert({
      where: {
        flowId_key: {
          flowId: flow.id,
          key: question.key
        }
      },
      update: {
        prompt: question.prompt,
        type: question.type,
        order: question.order,
        required: question.required,
        helpText: question.helpText
      },
      create: {
        flowId: flow.id,
        key: question.key,
        prompt: question.prompt,
        type: question.type,
        order: question.order,
        required: question.required,
        helpText: question.helpText
      }
    });
  }

  await prisma.rule.deleteMany({
    where: { flowId: flow.id, jurisdictionId: jurisdiction.id }
  });

  await prisma.rule.createMany({
    data: [
      {
        name: "No legal authority - Denied",
        description: "STR operator must have legal authority to operate the property.",
        reasoning: "Section 856-7 requires the applicant to be the property owner or have written authorization from the owner.",
        outcome: "denied",
        priority: 100,
        condition: {
          type: "comparison",
          fact: "answers.legal_authority",
          operator: "eq",
          value: false
        },
        recommendations: [
          "Obtain written authorization from the property owner before applying.",
          "Ensure you have legal authority to operate the property as a short-term rental."
        ],
        ordinanceCode: "856-7",
        sourceUrl: null,
        jurisdictionId: jurisdiction.id,
        flowId: flow.id,
        categoryId: category.id,
        subcategoryId: subcategory.id
      },
      {
        name: "Affordable housing - Denied",
        description: "Affordable housing units cannot be operated as short-term rentals.",
        reasoning: "Section 856-17(a) prohibits short-term rentals in deed-restricted or rent-restricted affordable housing.",
        outcome: "denied",
        priority: 95,
        condition: {
          type: "comparison",
          fact: "answers.affordable_housing",
          operator: "eq",
          value: true
        },
        recommendations: [
          "This property is not eligible for short-term rental registration.",
          "Consider long-term rental options to comply with affordability restrictions."
        ],
        ordinanceCode: "856-17(a)",
        sourceUrl: null,
        jurisdictionId: jurisdiction.id,
        flowId: flow.id,
        categoryId: category.id,
        subcategoryId: subcategory.id
      },
      {
        name: "No liability insurance - Denied",
        description: "Commercial general liability insurance of at least $500,000 is required.",
        reasoning: "Section 856-9(a) requires proof of commercial general liability insurance.",
        outcome: "denied",
        priority: 90,
        condition: {
          type: "comparison",
          fact: "answers.liability_insurance",
          operator: "eq",
          value: false
        },
        recommendations: [
          "Obtain commercial general liability insurance of at least $500,000.",
          "Ensure the insurance policy covers short-term rental operations."
        ],
        ordinanceCode: "856-9(a)",
        sourceUrl: null,
        jurisdictionId: jurisdiction.id,
        flowId: flow.id,
        categoryId: category.id,
        subcategoryId: subcategory.id
      },
      {
        name: "Not current on taxes/utilities - Denied",
        description: "All property taxes, utilities, and special assessments must be current.",
        reasoning: "Section 856-7(d)(5) requires certification that all taxes and bills are current.",
        outcome: "denied",
        priority: 85,
        condition: {
          type: "comparison",
          fact: "answers.current_taxes_utilities",
          operator: "eq",
          value: false
        },
        recommendations: [
          "Pay all outstanding property taxes, utility bills, and special assessments.",
          "Obtain documentation showing all accounts are current."
        ],
        ordinanceCode: "856-7(d)(5)",
        sourceUrl: null,
        jurisdictionId: jurisdiction.id,
        flowId: flow.id,
        categoryId: category.id,
        subcategoryId: subcategory.id
      },
      {
        name: "Not code compliant - Denied",
        description: "Property must comply with all building, housing, fire, and zoning codes.",
        reasoning: "Section 856-7(d)(6) requires certification of compliance with all applicable codes.",
        outcome: "denied",
        priority: 80,
        condition: {
          type: "comparison",
          fact: "answers.code_compliance",
          operator: "eq",
          value: false
        },
        recommendations: [
          "Address all code violations before applying for STR registration.",
          "Contact Building & Inspections to schedule compliance inspections."
        ],
        ordinanceCode: "856-7(d)(6)",
        sourceUrl: null,
        jurisdictionId: jurisdiction.id,
        flowId: flow.id,
        categoryId: category.id,
        subcategoryId: subcategory.id
      },
      {
        name: "Small building (≤4 units) - Approved",
        description: "Buildings with 4 or fewer units have no STR limit.",
        reasoning: "Section 856-17(b)(1) allows unlimited STRs in buildings with 4 or fewer dwelling units.",
        outcome: "approved",
        priority: 75,
        condition: {
          type: "and",
          conditions: [
            {
              type: "comparison",
              fact: "answers.legal_authority",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.affordable_housing",
              operator: "eq",
              value: false
            },
            {
              type: "comparison",
              fact: "answers.liability_insurance",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.current_taxes_utilities",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.code_compliance",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.total_dwelling_units",
              operator: "lte",
              value: 4
            }
          ]
        },
        recommendations: [
          "Proceed with STR registration application.",
          "Pay the required registration fee.",
          "Display registration certificate and contact information as required by Section 856-9."
        ],
        ordinanceCode: "856-17(b)(1)",
        sourceUrl: null,
        jurisdictionId: jurisdiction.id,
        flowId: flow.id,
        categoryId: category.id,
        subcategoryId: subcategory.id
      },
      {
        name: "Large building - Within limit",
        description: "Building with 5+ units is within STR limit per formula.",
        reasoning: "Section 856-17(b)(2) limits STRs to 4 units plus 1 per every 4 additional units beyond the first 4.",
        outcome: "approved",
        priority: 70,
        condition: {
          type: "and",
          conditions: [
            {
              type: "comparison",
              fact: "answers.legal_authority",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.affordable_housing",
              operator: "eq",
              value: false
            },
            {
              type: "comparison",
              fact: "answers.liability_insurance",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.current_taxes_utilities",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.code_compliance",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.total_dwelling_units",
              operator: "gte",
              value: 5
            },
            {
              type: "comparison",
              fact: "answers.pre_2019_operation",
              operator: "eq",
              value: false
            }
          ]
        },
        recommendations: [
          "Proceed with STR registration application.",
          "Note: Building limit is 4 STRs + 1 per every 4 additional units beyond the first 4.",
          "Display registration certificate and contact information as required by Section 856-9."
        ],
        ordinanceCode: "856-17(b)(2)",
        sourceUrl: null,
        jurisdictionId: jurisdiction.id,
        flowId: flow.id,
        categoryId: category.id,
        subcategoryId: subcategory.id
      },
      {
        name: "Grandfathered building - Approved",
        description: "Pre-2019 STR operations allow higher limits if grandfathered count exceeds formula.",
        reasoning: "Section 856-17(b)(3) allows grandfathered buildings to maintain pre-existing STR counts.",
        outcome: "conditional",
        priority: 65,
        condition: {
          type: "and",
          conditions: [
            {
              type: "comparison",
              fact: "answers.legal_authority",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.affordable_housing",
              operator: "eq",
              value: false
            },
            {
              type: "comparison",
              fact: "answers.liability_insurance",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.current_taxes_utilities",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.code_compliance",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.pre_2019_operation",
              operator: "eq",
              value: true
            }
          ]
        },
        recommendations: [
          "Your building may qualify for grandfathered STR limits.",
          "Provide documentation of pre-January 1, 2019 STR operation.",
          "The limit is the greater of: (a) formula-based limit or (b) pre-2019 count.",
          "Proceed with STR registration application."
        ],
        ordinanceCode: "856-17(b)(3)",
        sourceUrl: null,
        jurisdictionId: jurisdiction.id,
        flowId: flow.id,
        categoryId: category.id,
        subcategoryId: subcategory.id
      }
    ]
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
