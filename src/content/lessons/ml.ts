import type { Course } from "@/content/types";

export const machineLearning: Course = {
  id: "ml",
  title: "Machine Learning Essentials",
  tagline: "The training loop behind every model",
  description:
    "The mechanics under the hood: how a model learns from data, why gradient descent works, and how to tell a model that generalizes from one that memorized.",
  difficulty: "intermediate",
  glyph: "📈",
  gradient: "from-emerald-500 to-teal-600",
  lessons: [
    {
      id: "learning-from-data",
      title: "What 'Learning' Means",
      summary: "Parameters, loss functions, and the optimization framing.",
      minutes: 9,
      blocks: [
        {
          type: "text",
          body: "Machine learning replaces *writing rules* with *fitting parameters*. You define a model with adjustable numbers (weights), a **loss function** that scores how wrong its predictions are, and then you search for the weights that make the loss small.",
        },
        {
          type: "text",
          body: "That's it. Every architecture — linear regression, decision trees, transformers — is a different choice of what the adjustable function looks like. The optimization framing stays the same.",
        },
        {
          type: "code",
          lang: "python",
          caption: "The universal training loop",
          body: `for epoch in range(num_epochs):
    for batch_x, batch_y in dataloader:
        predictions = model(batch_x)              # forward pass
        loss = loss_fn(predictions, batch_y)      # how wrong were we?

        optimizer.zero_grad()                     # clear old gradients
        loss.backward()                           # backprop: d(loss)/d(weight)
        optimizer.step()                          # nudge weights downhill`,
        },
        {
          type: "heading",
          text: "Choosing a loss function",
        },
        {
          type: "text",
          body: "- **Mean squared error (MSE)** for regression — predicting a continuous number. Squaring makes big errors dominate, so MSE is sensitive to outliers.\n- **Cross-entropy** for classification — predicting a category. It measures the distance between your predicted distribution and the true one, and heavily punishes being confidently wrong.\n- Language models use cross-entropy too: at each position, the 'category' is *which token comes next*, over a vocabulary of tens of thousands.",
        },
        {
          type: "callout",
          tone: "key",
          title: "The connection to LLMs",
          body: "Pretraining a language model is exactly this loop, with the label for free: for every position in the text, the correct answer is simply the token that actually came next. No human annotation required — which is why it scales to internet-sized data.",
        },
        {
          type: "quiz",
          question: "Why can language models be pretrained on far more data than image classifiers?",
          options: [
            {
              text: "Text files are smaller than images.",
              correct: false,
              explanation:
                "File size isn't the bottleneck — labelling effort is. Plenty of image data exists; what's scarce is human-annotated image data.",
            },
            {
              text: "The training labels come free from the text itself — the next token is the answer.",
              correct: true,
              explanation:
                "Exactly. This is self-supervised learning. Classic image classification needs a human to label each picture; next-token prediction extracts billions of labelled examples from raw text with no annotator involved.",
            },
            {
              text: "Language models need less data because text is more information-dense.",
              correct: false,
              explanation:
                "The opposite of the premise — language models are trained on *more* data, not less. The reason is label availability.",
            },
          ],
        },
      ],
    },
    {
      id: "gradient-descent",
      title: "Gradient Descent, Visually",
      summary: "Rolling downhill on a loss surface, one step at a time.",
      minutes: 11,
      blocks: [
        {
          type: "text",
          body: "The loss function defines a landscape: every possible setting of the weights has a height (the loss). Training means finding a low valley. **Gradient descent** does it by computing the slope at your current position and stepping in the downhill direction.",
        },
        {
          type: "lab",
          lab: "gradient-descent",
          title: "Gradient descent simulator",
          body: "Fit a line to noisy data by watching the optimizer work. Crank the learning rate up until training diverges, then back it off until it crawls — the sweet spot in between is what practitioners spend real time hunting for.",
        },
        {
          type: "code",
          lang: "python",
          caption: "Gradient descent by hand, no framework",
          body: `import numpy as np

def fit_line(x, y, lr=0.01, steps=1000):
    w, b = 0.0, 0.0
    n = len(x)

    for _ in range(steps):
        y_pred = w * x + b
        error  = y_pred - y

        # Partial derivatives of MSE with respect to w and b
        grad_w = (2 / n) * np.sum(error * x)
        grad_b = (2 / n) * np.sum(error)

        # Step downhill. The minus sign is the whole algorithm.
        w -= lr * grad_w
        b -= lr * grad_b

    return w, b`,
        },
        {
          type: "heading",
          text: "The learning rate is the whole game",
        },
        {
          type: "text",
          body: "- **Too small**: training is correct but glacial, and you may stall on a plateau before reaching anything useful.\n- **Too large**: each step overshoots the valley, the loss oscillates or explodes to `NaN`, and nothing converges.\n- **Just right**: fast early progress that settles smoothly.",
        },
        {
          type: "callout",
          tone: "info",
          title: "What real optimizers add",
          body: "Adam and friends keep a running estimate of each parameter's gradient history, so parameters with small, consistent gradients get larger effective steps. It's still gradient descent — with per-parameter adaptive step sizes bolted on.",
        },
        {
          type: "quiz",
          question:
            "Your training loss drops for a few steps, then jumps to NaN. What's the first thing to check?",
          options: [
            {
              text: "The learning rate is too high, causing steps that overshoot and diverge.",
              correct: true,
              explanation:
                "This is the classic signature. Each step overshoots the minimum and lands somewhere with a larger gradient, which produces an even bigger next step — a feedback loop that blows up within a handful of iterations. Cut the learning rate by 10× and retry.",
            },
            {
              text: "The model is too small for the data.",
              correct: false,
              explanation:
                "Insufficient capacity shows up as loss plateauing at a high value — the model underfits. It doesn't produce numerical explosion.",
            },
            {
              text: "You need more training data.",
              correct: false,
              explanation:
                "Data volume affects generalization, not numerical stability. NaN within a few steps points squarely at the optimization setup.",
            },
          ],
        },
      ],
    },
    {
      id: "generalization",
      title: "Overfitting, Underfitting, and Honest Evaluation",
      summary: "Telling real learning apart from memorization.",
      minutes: 10,
      blocks: [
        {
          type: "text",
          body: "A model that scores perfectly on its training data may be worthless. The only question that matters is how it performs on data it has never seen — **generalization**.",
        },
        {
          type: "heading",
          text: "The two failure modes",
        },
        {
          type: "text",
          body: "- **Underfitting**: the model is too simple to capture the real pattern. Training error and validation error are both high, and they're close together.\n- **Overfitting**: the model memorized the training set, including its noise. Training error is low, validation error is high, and the gap between them is the tell.",
        },
        {
          type: "callout",
          tone: "key",
          title: "Read the gap, not the number",
          body: "Low training error alone tells you nothing. It's the *gap* between training and validation performance that diagnoses overfitting.",
        },
        {
          type: "heading",
          text: "Splitting your data",
        },
        {
          type: "text",
          body: "- **Training set** (~70%) — what the optimizer actually fits.\n- **Validation set** (~15%) — used to tune hyperparameters and decide when to stop.\n- **Test set** (~15%) — touched *once*, at the very end, to report an honest number.",
        },
        {
          type: "callout",
          tone: "warn",
          title: "Data leakage will fool you",
          body: "If information from validation or test data reaches training — duplicate rows across splits, normalizing using statistics computed over the full dataset, or a time series split randomly instead of chronologically — your metrics will look excellent and your production performance will not match them.",
        },
        {
          type: "code",
          lang: "python",
          caption: "Fitting the scaler on train only — a leak-free split",
          body: `from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.3, random_state=42
)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.5, random_state=42
)

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)  # fit ONLY on training data
X_val   = scaler.transform(X_val)        # then apply the same transform
X_test  = scaler.transform(X_test)`,
        },
        {
          type: "quiz",
          question:
            "Training accuracy is 99%, validation accuracy is 71%, and the gap keeps widening with more epochs. What's happening?",
          options: [
            {
              text: "Underfitting — the model needs more capacity.",
              correct: false,
              explanation:
                "Underfitting means both numbers are poor. 99% training accuracy proves the model has more than enough capacity — it's using that capacity to memorize.",
            },
            {
              text: "Overfitting — stop earlier, add regularization, or get more data.",
              correct: true,
              explanation:
                "The widening gap is the definitive signature. Standard remedies: early stopping at the validation minimum, dropout or weight decay, data augmentation, or simply more training data.",
            },
            {
              text: "The learning rate is too low.",
              correct: false,
              explanation:
                "A low learning rate slows convergence; it doesn't create a train/validation gap. The gap is about what the model learned, not how fast it got there.",
            },
          ],
        },
        {
          type: "quiz",
          question:
            "You tune 40 hyperparameter combinations against your test set and report the best result. What's wrong?",
          options: [
            {
              text: "Nothing — picking the best configuration is the point of tuning.",
              correct: false,
              explanation:
                "Tuning is fine; tuning *against the test set* is not. Selecting the best of 40 runs on the test set means that number is now an optimistic estimate, not a held-out one.",
            },
            {
              text: "The test set has effectively become a validation set, so the reported score is optimistic.",
              correct: true,
              explanation:
                "Correct. Every selection decision made against a dataset leaks a little information about it. Tune on validation, then touch the test set exactly once for the final reported number.",
            },
            {
              text: "40 combinations is too few to find a good configuration.",
              correct: false,
              explanation:
                "The count isn't the issue — the methodology is. Even 3 combinations selected on the test set compromise the honesty of the final estimate.",
            },
          ],
        },
      ],
    },
  ],
};
