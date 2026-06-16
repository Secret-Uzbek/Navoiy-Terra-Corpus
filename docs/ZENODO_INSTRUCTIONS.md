# Zenodo Deposit Instructions

## How to Archive Navoiy-Terra Corpus on Zenodo

### Step 1: Prepare Your Files
1. Download the complete corpus:
   ```bash
   git clone https://github.com/Secret-Uzbek/navoiy-terra-corpus.git
   cd navoiy-terra-corpus
   tar -czf navoiy-terra-corpus-v1.0.tar.gz .
   ```

### Step 2: Go to Zenodo
1. Open https://zenodo.org
2. Click "Upload"
3. Login with your GitHub account

### Step 3: Fill Metadata
**Title:** Navoiy-Terra Corpus v1.0 - First Computational Corpus of Alisher Navoi Works  
**Creators:** Abdukarimov, Abdurashid  
**Description:** [Copy from README.md About section]  
**Keywords:** Alisher Navoi, digital humanities, computational linguistics, Chagatai, Uzbek literature, Persian literature, Turkic studies  
**License:** Creative Commons Attribution 4.0 International  
**Version:** 1.0.0  
**Upload Type:** Dataset  
**Publication Date:** 2026-02-09  

### Step 4: Connect to GitHub (Optional)
1. In Zenodo Settings → GitHub
2. Enable "Navoiy-Terra-Corpus" repository
3. Every new GitHub release will auto-archive to Zenodo

### Step 5: Publish
1. Click "Publish"
2. Copy your DOI (e.g., 10.5281/zenodo.XXXXXXX)
3. Update the DOI in:
   - README.md
   - index.html (GitHub Pages)
   - CITATION.md

### Expected DOI Badge:
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.XXXXXXX.svg)](https://doi.org/10.5281/zenodo.XXXXXXX)

## Citation After Zenodo Archive
**APA:**
Abdukarimov, A. (2026). _Navoiy-Terra Corpus v1.0_ (Version 1.0.0) [Data set]. Zenodo. https://doi.org/10.5281/zenodo.XXXXXXX

**BibTeX:**
```
@dataset{abdukarimov_2026_navoiy,
  author = {Abdukarimov, Abdurashid},
  title = {Navoiy-Terra Corpus v1.0},
  year = {2026},
  publisher = {Zenodo},
  version = {1.0.0},
  doi = {10.5281/zenodo.XXXXXXX},
  url = {https://doi.org/10.5281/zenodo.XXXXXXX}
}
```

## Important Notes
- DOI is permanent - never changes
- Archives are immutable - can't edit after publish
- Create new version for updates (v1.1, v2.0)
- Use "Reserve DOI" if needed for paper submission

---
**Ready for submission to:** V International Symposium "Navoiy va Sharq Renessansi"  
**Contact:** a.abdukarimov@fractal-metascience.org  
**ORCID:** 0009-0000-6394-4912