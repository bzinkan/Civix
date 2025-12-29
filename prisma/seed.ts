import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const jurisdiction =
    (await prisma.jurisdiction.findFirst({
      where: { name: "Demo City", state: "OH" }
    })) ??
    (await prisma.jurisdiction.create({
      data: {
        name: "Demo City",
        state: "OH",
        type: "city"
      }
    }));

  const category =
    (await prisma.ruleCategory.findFirst({
      where: { slug: "animals", jurisdictionId: jurisdiction.id }
    })) ??
    (await prisma.ruleCategory.create({
      data: {
        name: "Animals",
        slug: "animals",
        jurisdictionId: jurisdiction.id
      }
    }));

  const subcategory =
    (await prisma.ruleSubcategory.findFirst({
      where: { slug: "restricted-breeds", categoryId: category.id }
    })) ??
    (await prisma.ruleSubcategory.create({
      data: {
        name: "Restricted Breeds",
        slug: "restricted-breeds",
        categoryId: category.id
      }
    }));

  const flow =
    (await prisma.decisionFlow.findFirst({
      where: { name: "Animals – Restricted Breeds", jurisdictionId: jurisdiction.id }
    })) ??
    (await prisma.decisionFlow.create({
      data: {
        name: "Animals – Restricted Breeds",
        label: "Restricted Breed Check",
        description:
          "Determine whether restricted dog breeds are permitted in Demo City.",
        jurisdictionId: jurisdiction.id
      }
    }));

  const questions = [
    {
      key: "animal_type",
      prompt: "What type of animal are you registering?",
      type: "select",
      order: 1,
      required: true,
      options: [
        { label: "Dog", value: "dog" },
        { label: "Cat", value: "cat" },
        { label: "Other", value: "other" }
      ]
    },
    {
      key: "is_restricted_breed",
      prompt: "Is the animal a restricted breed?",
      type: "boolean",
      order: 2,
      required: true,
      helpText: "Restricted breeds require additional approval."
    },
    {
      key: "grandfathered",
      prompt: "Was the animal owned before the restriction took effect?",
      type: "boolean",
      order: 3,
      required: true
    },
    {
      key: "has_insurance",
      prompt: "Do you have proof of required liability insurance?",
      type: "boolean",
      order: 4,
      required: true
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
        helpText: question.helpText,
        options: question.options
      },
      create: {
        flowId: flow.id,
        key: question.key,
        prompt: question.prompt,
        type: question.type,
        order: question.order,
        required: question.required,
        helpText: question.helpText,
        options: question.options
      }
    });
  }

  await prisma.rule.deleteMany({
    where: { flowId: flow.id, jurisdictionId: jurisdiction.id }
  });

  await prisma.rule.createMany({
    data: [
      {
        name: "Non-dog animals allowed",
        description: "Restrictions only apply to dogs.",
        reasoning: "The restricted breed ordinance applies only to dogs.",
        outcome: "approved",
        priority: 100,
        condition: {
          type: "comparison",
          fact: "answers.animal_type",
          operator: "ne",
          value: "dog"
        },
        recommendations: ["No restricted breed review is required."],
        ordinanceCode: "RBC-100",
        sourceUrl: "https://example.com/ordinance/restricted-breeds#scope",
        jurisdictionId: jurisdiction.id,
        flowId: flow.id,
        categoryId: category.id,
        subcategoryId: subcategory.id
      },
      {
        name: "Non-restricted dogs allowed",
        description: "Non-restricted dog breeds are permitted.",
        reasoning: "Only restricted breeds are subject to the ban.",
        outcome: "approved",
        priority: 90,
        condition: {
          type: "and",
          conditions: [
            {
              type: "comparison",
              fact: "answers.animal_type",
              operator: "eq",
              value: "dog"
            },
            {
              type: "comparison",
              fact: "answers.is_restricted_breed",
              operator: "eq",
              value: false
            }
          ]
        },
        recommendations: ["Maintain standard dog registration records."],
        ordinanceCode: "RBC-210",
        sourceUrl: "https://example.com/ordinance/restricted-breeds#allowed",
        jurisdictionId: jurisdiction.id,
        flowId: flow.id,
        categoryId: category.id,
        subcategoryId: subcategory.id
      },
      {
        name: "Restricted dogs with grandfathering and insurance",
        description:
          "Grandfathered restricted breeds may stay with insurance proof.",
        reasoning:
          "Restricted breeds are conditionally allowed when grandfathered and insured.",
        outcome: "conditional",
        priority: 80,
        condition: {
          type: "and",
          conditions: [
            {
              type: "comparison",
              fact: "answers.animal_type",
              operator: "eq",
              value: "dog"
            },
            {
              type: "comparison",
              fact: "answers.is_restricted_breed",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.grandfathered",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.has_insurance",
              operator: "eq",
              value: true
            }
          ]
        },
        recommendations: [
          "Provide proof of insurance and maintain grandfathering documentation."
        ],
        ordinanceCode: "RBC-305",
        sourceUrl: "https://example.com/ordinance/restricted-breeds#exceptions",
        jurisdictionId: jurisdiction.id,
        flowId: flow.id,
        categoryId: category.id,
        subcategoryId: subcategory.id
      },
      {
        name: "Restricted dogs without grandfathering",
        description: "Restricted breeds without grandfathering are denied.",
        reasoning:
          "Restricted breeds must be grandfathered to be kept within city limits.",
        outcome: "denied",
        priority: 70,
        condition: {
          type: "and",
          conditions: [
            {
              type: "comparison",
              fact: "answers.animal_type",
              operator: "eq",
              value: "dog"
            },
            {
              type: "comparison",
              fact: "answers.is_restricted_breed",
              operator: "eq",
              value: true
            },
            {
              type: "comparison",
              fact: "answers.grandfathered",
              operator: "eq",
              value: false
            }
          ]
        },
        recommendations: [
          "Contact animal control for guidance on restricted breeds."
        ],
        ordinanceCode: "RBC-402",
        sourceUrl: "https://example.com/ordinance/restricted-breeds#ban",
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
