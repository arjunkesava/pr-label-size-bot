import { Application, Context } from 'probot';

/**
 * size-XS => ' PR has less than 50 lines of code changed. '
 * size-S => ' Small PR with 50 - 99 lines of code changed. '
 * size-M => ' Medium PR with 100 - 399 lines of code changed. '
 * size-L => ' Large PR with 400 - 799 lines of code changed. '
 * size-XL => ' Extra Large PR with 800+ lines of code changed. '
 */
const standardLabels = ['size-XS', 'size-S', 'size-M', 'size-L', 'size-XL'];

async function handlePullRequestChange (_: Application, context: Context) {
  const {
    payload: {
      body,
      pull_request: {
        additions,
        deletions,
        labels,
      }
    },
    octokit,
  } = context;
  const issue = context.issue({ body });
  const totalSize = additions + deletions;
  let isNewLabelExists = false;

  const newLabel = getNewLabelBySize(totalSize);

  // Check whether a label exists already
  if(labels.length) {
    // Run through all existing
    for (const existingLabel of labels) {
      if(existingLabel.name === newLabel) {
        isNewLabelExists = true;
      } else if(standardLabels.some(label => label === existingLabel.name)) {
        await octokit.issues.removeLabel({ ...issue, name: existingLabel.name});
      }
    }
  }

  const labelBody = {
    labels: [newLabel],
  };

  if(!isNewLabelExists) {
    // Assign the label to the PR. Done
    await octokit.issues.addLabels({...issue, ...labelBody});  
  }
}

function getNewLabelBySize(totalSize: number): string {
  if (totalSize < 50) {
    return "size-XS";
  } else if (totalSize >= 50 && totalSize < 100) {
    return "size-S";
  } else if (totalSize >= 100 && totalSize < 400) {
    return "size-M";
  } else if (totalSize >= 400 && totalSize < 800) {
    return "size-L";
  } else if (totalSize >= 800) {
    return "size-XL";
  }
  return '';
}

const PrSizeLabeller = (app: Application) => {
  app.on('pull_request.opened', handlePullRequestChange.bind(null, app));
  app.on('pull_request.synchronize', handlePullRequestChange.bind(null, app));
}

module.exports = PrSizeLabeller;