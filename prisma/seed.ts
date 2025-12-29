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
      where: { slug: "dangerous-breeds", categoryId: category.id }
    })) ??
    (await prisma.ruleSubcategory.create({
      data: {
        name: "Dangerous Breeds",
        slug: "dangerous-breeds",
        categoryId: category.id
      }
    }));

  const flow =
    (await prisma.decisionFlow.findFirst({
      where: { name: "Animal Permit Flow", jurisdictionId: jurisdiction.id }
    })) ??
    (await prisma.decisionFlow.create({
      data: {
        name: "Animal Permit Flow",
        label: "Animal Permit Check",
        description:
          "Evaluate pet ownership requirements for Demo City residents.",
        jurisdictionId: jurisdiction.id
      }
    }));

  const existingQuestions = await prisma.question.count({
    where: { flowId: flow.id }
  });

  if (existingQuestions === 0) {
    await prisma.question.create({
      data: {
        flowId: flow.id,
        prompt: "What type of animal are you registering?",
        type: "select",
        order: 1,
        required: true,
        options: [
          { label: "Dog", value: "dog" },
          { label: "Cat", value: "cat" },
          { label: "Other", value: "other" }
        ]
      }
    });
    await prisma.question.create({
      data: {
        flowId: flow.id,
        prompt: "Is the animal a restricted breed?",
        type: "boolean",
        order: 2,
        required: true,
        helpText: "Restricted breeds require special approval."
      }
    });
    await prisma.question.create({
      data: {
        flowId: flow.id,
        prompt: "How many dogs will be kept on the property?",
        type: "number",
        order: 3,
        required: true
      }
    });
    await prisma.question.create({
      data: {
        flowId: flow.id,
        prompt: "Is the property zoned residential?",
        type: "boolean",
        order: 4,
        required: true
      }
    });
  }

  const questions = await prisma.question.findMany({
    where: { flowId: flow.id },
    orderBy: { order: "asc" }
  });
  const questionIds = questions.reduce<Record<number, string>>((acc, question) => {
    acc[question.order] = question.id;
    return acc;
  }, {});

  if (
    !questionIds[1] ||
    !questionIds[2] ||
    !questionIds[3] ||
    !questionIds[4]
  ) {
    throw new Error("Demo flow questions are missing.");
  }

  const existingRules = await prisma.rule.count({
    where: { flowId: flow.id, jurisdictionId: jurisdiction.id }
  });

  if (existingRules === 0) {
    await prisma.rule.createMany({
      data: [
        {
          name: "Restricted breed ban",
          description: "Restricted dog breeds are prohibited in Demo City.",
          reasoning:
            "Demo City ordinance prohibits restricted dog breeds within city limits.",
          outcome: "denied",
          priority: 100,
          condition: {
            type: "and",
            conditions: [
              {
                type: "comparison",
                fact: `answers.${questionIds[1]}`,
                operator: "eq",
                value: "dog"
              },
              {
                type: "comparison",
                fact: `answers.${questionIds[2]}`,
                operator: "eq",
                value: true
              }
            ]
          },
          recommendations: [
            "Consult the animal control office before acquiring a restricted breed."
          ],
          ordinanceCode: "ORD-100",
          sourceUrl: "https://example.com/ordinance/100",
          jurisdictionId: jurisdiction.id,
          flowId: flow.id,
          categoryId: category.id,
          subcategoryId: subcategory.id
        },
        {
          name: "Large dog household review",
          description: "Households with more than three dogs require review.",
          reasoning:
            "An inspection is required if more than three dogs are kept.",
          outcome: "needs_review",
          priority: 80,
          condition: {
            type: "and",
            conditions: [
              {
                type: "comparison",
                fact: `answers.${questionIds[1]}`,
                operator: "eq",
                value: "dog"
              },
              {
                type: "comparison",
                fact: `answers.${questionIds[3]}`,
                operator: "gt",
                value: 3
              }
            ]
          },
          recommendations: [
            "Schedule a property inspection with the health department."
          ],
          ordinanceCode: "ORD-220",
          sourceUrl: "https://example.com/ordinance/220",
          jurisdictionId: jurisdiction.id,
          flowId: flow.id,
          categoryId: category.id
        },
        {
          name: "Cats generally allowed",
          description: "Cats are permitted in residential zones.",
          reasoning: "Cats are permitted with standard registration.",
          outcome: "approved",
          priority: 50,
          condition: {
            type: "and",
            conditions: [
              {
                type: "comparison",
                fact: `answers.${questionIds[1]}`,
                operator: "eq",
                value: "cat"
              },
              {
                type: "comparison",
                fact: `answers.${questionIds[4]}`,
                operator: "eq",
                value: true
              }
            ]
          },
          recommendations: ["Register the animal within 30 days."],
          ordinanceCode: "ORD-310",
          sourceUrl: "https://example.com/ordinance/310",
          jurisdictionId: jurisdiction.id,
          flowId: flow.id,
          categoryId: category.id
        },
        {
          name: "Non-residential animal allowance",
          description:
            "Non-residential zoning permits a wider range of animals.",
          reasoning:
            "Non-residential parcels may host animals when zoning allows.",
          outcome: "approved",
          priority: 40,
          condition: {
            type: "or",
            conditions: [
              {
                type: "comparison",
                fact: `answers.${questionIds[4]}`,
                operator: "eq",
                value: false
              },
              {
                type: "comparison",
                fact: `answers.${questionIds[1]}`,
                operator: "eq",
                value: "other"
              }
            ]
          },
          recommendations: [
            "Verify zoning permissions before finalizing the permit."
          ],
          ordinanceCode: "ORD-410",
          sourceUrl: "https://example.com/ordinance/410",
          jurisdictionId: jurisdiction.id,
          flowId: flow.id,
          categoryId: category.id
        }
      ]
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
