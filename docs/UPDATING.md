# Updating the Website

This guide explains how to add new datasets to the open-source imaging datasets website.

## Overview

The website is controlled by a CSV file located at [`public/data/ultrasound_dataset_complete.csv`](../public/data/ultrasound_dataset_complete.csv). When you update this file and merge your changes to the `main` branch, the website will automatically update via the CI/CD pipeline.

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

Open [`public/data/ultrasound_dataset_complete.csv`](../public/data/ultrasound_dataset_complete.csv) and add your new dataset(s) following the existing format.

The CSV file has the following columns:
- **Dataset Name**: The name of the dataset
- **Modalities**: Type of ultrasound (e.g., "US", "US (2D)", "US (Video)")
- **Clinical Application**: Body area or application (e.g., "Liver Cancer", "Prostate")
- **Registraition Type of Patients**: Registration type (Y/N)
- **Segmentaitions Available**: Are segmentations available? (Y/N)
- **Landmarks Available**: Are landmarks available? (Y/N)
- **Meshes (STL) Available**: Are meshes available? (Y/N)
- **Tracking / Pose Data**: Is tracking data available? (Y/N)
- **Ground-Truth Transformations**: Are GT transforms available? (Y/N)
- **Subjects**: Number of subjects
- **Link**: URL to the dataset
- **Source**: Institution or source of data
- **DOI**: Digital Object Identifier
- **Licence**: Licensing information (e.g., CC BY 4.0)
- **Notes**: Extra information

**Important**:
- Maintain the CSV format (comma-separated values)
- Ensure all required fields are filled
- Follow the existing naming conventions and formatting
- If a field contains commas, make sure it's properly quoted

### 4. Commit Your Changes

Stage and commit your changes:

```bash
git add public/data/ultrasound_dataset_complete.csv
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
Dataset Name,Modalities,Clinical Application,Registraition Type of Patients,Segmentaitions Available,Landmarks Available,Meshes (STL) Available,Tracking / Pose Data,Ground-Truth Transformations,Subjects,Link,Source,DOI,Licence,Notes
Example Dataset,US,General,N,Y,N,N,N,N,100,https://example.com/dataset,Source Inst,10.XXXX/XXXX,CC BY 4.0,A description
```

## Questions?

If you have questions or need help, please open an issue on the repository or contact the maintainers.
