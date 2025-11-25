# Updating the Website

This guide explains how to add new datasets to the open-source imaging datasets website.

## Overview

The website is controlled by a CSV file located at [`public/data/snapshot-dataset.csv`](../public/data/snapshot-dataset.csv). When you update this file and merge your changes to the `main` branch, the website will automatically update via the CI/CD pipeline.

## Step-by-Step Process

### 1. Clone the Repository

First, clone the repository to your local machine:

```bash
git clone https://github.com/nidus-lab/open-source-imaging-data-sets.git
cd open-source-imaging-data-sets
```

### 2. Create a New Branch

Create a new branch for your changes:

```bash
git checkout -b add-<dataset-name>-dataset
```

### 3. Update the CSV File

Open [`public/data/snapshot-dataset.csv`](../public/data/snapshot-dataset.csv) and add your new dataset(s) following the existing format.

The CSV file has the following columns:
- **Name**: The name of the dataset
- **URL**: Link to the dataset
- **Area of body**: Body area covered (e.g., "General MSK", "Hip", "Cardiac")
- **Imaging type**: Type of imaging (e.g., "Ultrasound, 2D", "Ultrasound, Video")
- **Type of Resource**: Category (e.g., "Dataset", "Utility")
- **Open access**: TRUE/FALSE
- **Access on application**: TRUE/FALSE
- **Commercial access**: TRUE/FALSE
- **Area of focus**: Specific focus area
- **Data notes**: Description or notes about the dataset

**Important**: 
- Maintain the CSV format (comma-separated values)
- Ensure all required fields are filled
- Follow the existing naming conventions and formatting
- If a field contains commas, make sure it's properly quoted

### 4. Commit Your Changes

Stage and commit your changes:

```bash
git add public/data/snapshot-dataset.csv
git commit -m "Adds new dataset(s): [Dataset Name(s)]"
```

### 5. Push to GitHub and Create a Pull Request

Push your branch to GitHub:

```bash
git push origin add-new-datasets
```

Then create a Pull Request (PR) on GitHub:
1. Go to the repository on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Add a description of the datasets you're adding
5. Submit the PR

### 6. Review and Merge

After your PR is reviewed and approved, it will be merged into the `main` branch. Once merged, the CI/CD pipeline will automatically:
- Build the website
- Deploy it to GitHub Pages
- Update the live website

No additional action is required on your part!

## CSV Format Example

Here's an example of how a dataset entry should look in the CSV:

```csv
Name,URL,Area of body,Imaging type,Type of Resource,Open access,Access on application,Commercial access,Area of focus,Data notes
Example Dataset,https://example.com/dataset,General,Ultrasound,Dataset,TRUE,FALSE,TRUE,General Ultrasound,A description of the dataset
```

## Questions?

If you have questions or need help, please open an issue on the repository or contact the maintainers.

