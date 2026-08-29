import { Button, Card } from '../../../../shared/ui';
import '../../../../LandingPage.css';

type Props = {
  onRegister: () => void;
  onLogin: () => void;
};

const capabilities = [
  {
    title: 'Artifact Intelligence',
    items: ['Metadata inspection', 'Hashing', 'Format identification', 'Integrity signals'],
  },
  {
    title: 'Security Analysis',
    items: ['Malware scanning', 'Signature review', 'Certificate information', 'Suspicious findings'],
  },
  {
    title: 'Automation',
    items: ['REST API', 'CI/CD integration', 'Machine-readable results', 'Verification workflows'],
  },
];

const steps = [
  {
    index: '01',
    title: 'Upload',
    copy: 'Submit an artifact for inspection and capture its metadata, hash, and size.',
  },
  {
    index: '02',
    title: 'Analyze',
    copy: 'Evaluate the artifact for integrity signals, malware findings, and certificate details.',
  },
  {
    index: '03',
    title: 'Verify',
    copy: 'Review structured results so your team can decide what is safe to ship or deploy.',
  },
  {
    index: '04',
    title: 'Integrate',
    copy: 'Connect verification into release tooling and automated deployment pipelines.',
  },
];

const useCases = [
  'Before deployment',
  'Before distribution',
  'In CI/CD',
  'For third-party software review',
];

function Navbar({ onLogin, onRegister }: Props) {
  return (
    <header className="lp-nav">
      <div className="lp-container lp-nav-inner">
        <button className="lp-brand" type="button" aria-label="Tech Pulse home">
          <span className="lp-brand-mark" aria-hidden="true">TP</span>
          <span className="lp-brand-copy">
            <strong>Tech Pulse</strong>
            <span>Software verification platform</span>
          </span>
        </button>

        <nav className="lp-nav-links" aria-label="Primary">
          <a href="#product">Product</a>
          <a href="#how-it-works">How it works</a>
          <a href="#developers">Developers</a>
          <a href="#documentation">Documentation</a>
        </nav>

        <div className="lp-nav-actions">
          <Button className="lp-ghost-button" variant="ghost" onClick={onLogin}>
            Sign In
          </Button>
          <Button className="lp-primary-button" onClick={onRegister}>
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}

function SectionHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="lp-section-header">
      {eyebrow ? <p className="lp-eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

function HeroProductPreview() {
  return (
    <Card className="lp-preview-card" aria-label="Product preview">
      <div className="lp-preview-top">
        <div>
          <span className="lp-status lp-status-good">Verified</span>
          <h3>artifact-linux-x64.tar.gz</h3>
        </div>
        <span className="lp-preview-meta">Example verification report</span>
      </div>

      <dl className="lp-preview-grid">
        <div>
          <dt>Version</dt>
          <dd>1.0.0</dd>
        </div>
        <div>
          <dt>SHA-256</dt>
          <dd>7d8c...91af</dd>
        </div>
        <div>
          <dt>File type</dt>
          <dd>Tar archive</dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>18.4 MB</dd>
        </div>
      </dl>

      <div className="lp-preview-panel">
        <div className="lp-preview-panel-head">
          <span>Security analysis</span>
          <span className="lp-preview-badge">Structured output</span>
        </div>
        <div className="lp-preview-result">
          <div>
            <strong>Integrity</strong>
            <span className="lp-status lp-status-good">Verified</span>
          </div>
          <div>
            <strong>Malware detection</strong>
            <span className="lp-status lp-status-good">No findings</span>
          </div>
          <div>
            <strong>Certificate</strong>
            <span className="lp-status lp-status-warn">Not present</span>
          </div>
        </div>
      </div>

      <div className="lp-preview-timeline">
        <div>
          <span>Uploaded</span>
          <strong>12:41 UTC</strong>
        </div>
        <div>
          <span>Scanned</span>
          <strong>12:42 UTC</strong>
        </div>
        <div>
          <span>Ready to verify</span>
          <strong>12:42 UTC</strong>
        </div>
      </div>
    </Card>
  );
}

export function LandingRoutePage({ onRegister, onLogin }: Props) {
  return (
    <div className="lp-root">
      <Navbar onRegister={onRegister} onLogin={onLogin} />

      <main>
        <section className="lp-hero lp-container">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow">Software verification for technical teams</p>
            <h1>Know what you're shipping.</h1>
            <p className="lp-hero-text">
              Tech Pulse helps teams inspect software artifacts, review integrity signals, and understand security findings before releases reach users or infrastructure.
            </p>

            <div className="lp-hero-actions">
              <Button className="lp-primary-button" onClick={onRegister}>
                Get Started
              </Button>
              <a className="lp-secondary-link" href="#product">
                Explore Verification
              </a>
            </div>

            <div className="lp-trust-strip" aria-label="Product trust indicators">
              <span>Evidence-led</span>
              <span>API-ready</span>
              <span>Built for automation</span>
              <span>Security-conscious</span>
            </div>
          </div>

          <HeroProductPreview />
        </section>

        <section className="lp-container lp-slim-band">
          <p>
            Built for teams that need confidence in the software they ship, deploy, and receive from third parties.
          </p>
        </section>

        <section className="lp-container lp-section" id="how-it-works">
          <SectionHeader
            eyebrow="How it works"
            title="A disciplined workflow for release review"
            description="Keep the process clear: upload, inspect, verify, and integrate the result into the tools your team already uses."
          />
          <div className="lp-steps-grid">
            {steps.map((step) => (
              <Card key={step.title} className="lp-step-card">
                <span className="lp-step-index">{step.index}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="lp-container lp-section" id="product">
          <SectionHeader
            eyebrow="Product preview"
            title="A restrained preview of the verification experience"
            description="Useful status, structured results, and clear artifact details without theatrical visuals."
          />
          <div className="lp-product-layout">
            <Card className="lp-report-card">
              <div className="lp-report-head">
                <div>
                  <p className="lp-eyebrow">Artifact report</p>
                  <h3>application-windows-x64.zip</h3>
                </div>
                <span className="lp-status lp-status-good">Verification ready</span>
              </div>

              <div className="lp-report-grid">
                <div>
                  <span>Artifact</span>
                  <strong>application-windows-x64.zip</strong>
                </div>
                <div>
                  <span>Version</span>
                  <strong>2.1.0</strong>
                </div>
                <div>
                  <span>SHA-256</span>
                  <strong>f1b2...a9c4</strong>
                </div>
                <div>
                  <span>File type</span>
                  <strong>Zip archive</strong>
                </div>
              </div>

              <div className="lp-report-analysis">
                <div className="lp-report-analysis-head">
                  <strong>Analysis results</strong>
                  <span>Designed for evidence-based review</span>
                </div>
                <div className="lp-analysis-row">
                  <span>Integrity</span>
                  <span className="lp-status lp-status-good">Verified</span>
                </div>
                <div className="lp-analysis-row">
                  <span>Malware</span>
                  <span className="lp-status lp-status-good">No findings</span>
                </div>
                <div className="lp-analysis-row">
                  <span>Signature</span>
                  <span className="lp-status lp-status-muted">Not checked</span>
                </div>
                <div className="lp-analysis-row">
                  <span>Certificate</span>
                  <span className="lp-status lp-status-muted">Not present</span>
                </div>
              </div>
            </Card>

            <Card className="lp-side-stack" id="verification">
              <SectionHeader
                eyebrow="Verification"
                title="Evidence over claims"
                description="Security decisions should be based on structured findings, not marketing language."
              />

              <div className="lp-side-list">
                <div>
                  <strong>Artifact Intelligence</strong>
                  <p>File metadata, hashing, format identification, and integrity context.</p>
                </div>
                <div>
                  <strong>Security Analysis</strong>
                  <p>Malware analysis, signature inspection, and certificate information.</p>
                </div>
                <div>
                  <strong>Automation</strong>
                  <p>REST API access, machine-readable results, and CI/CD-friendly workflows.</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="lp-container lp-section" id="capabilities">
          <SectionHeader
            eyebrow="Capabilities"
            title="Three capabilities that matter in practice"
            description="The page avoids a generic feature grid and instead groups capabilities into the three functions that matter most."
          />
          <div className="lp-capability-grid">
            {capabilities.map((capability) => (
              <Card key={capability.title} className="lp-capability-card">
                <h3>{capability.title}</h3>
                <ul>
                  {capability.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        <section className="lp-container lp-section" id="developers">
          <SectionHeader
            eyebrow="Developers"
            title="Built to fit into engineering workflows"
            description="Use the product in a browser or wire it into release automation with a clear, testable interface."
          />
          <div className="lp-api-grid">
            <Card className="lp-code-card" id="documentation">
              <div className="lp-code-card-head">
                <span>API preview</span>
                <span className="lp-preview-badge">Multipart upload</span>
              </div>
              <pre className="lp-code-block" aria-label="API example">
{`curl -X POST \
  https://api.example.com/v1/software-management/upload \
  -H "Authorization: Bearer $API_KEY" \
  -F "files=@application-linux-x64.tar.gz" \
  -F "files=@checksums.txt"`}
              </pre>
              <pre className="lp-code-block lp-code-block-muted" aria-label="API response example">
{`{
  "software_id": "...",
  "version_id": "...",
  "version": "1.0.0",
  "artifacts": [
    { "filename": "application-linux-x64.tar.gz", "status": "active" },
    { "filename": "checksums.txt", "status": "active" }
  ]
}`}
              </pre>
            </Card>

            <Card className="lp-usecases-card">
              <SectionHeader
                eyebrow="Use cases"
                title="Practical moments where verification matters"
              />
              <div className="lp-usecase-list">
                {useCases.map((item) => (
                  <div key={item}>
                    <span className="lp-step-index lp-step-index-small">{item.slice(0, 2)}</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="lp-container lp-section">
          <SectionHeader
            eyebrow="Security"
            title="Evidence first, always"
            description="The point is not to promise perfect safety. The point is to make software review faster, clearer, and easier to automate."
          />
          <div className="lp-security-grid">
            <Card>
              <strong>Calm confidence</strong>
              <p>Restrained visuals, clear typography, and a layout that reads like infrastructure software, not consumer hype.</p>
            </Card>
            <Card>
              <strong>Built for teams</strong>
              <p>Designed for developers, security engineers, and DevSecOps workflows that need repeatable verification steps.</p>
            </Card>
            <Card>
              <strong>Honest boundaries</strong>
              <p>No fabricated detection rates, no fake customer logos, and no implied guarantees the product does not make.</p>
            </Card>
          </div>
        </section>

        <section className="lp-container lp-section">
          <Card className="lp-final-cta">
            <div>
              <p className="lp-eyebrow">Get started</p>
              <h2>Build trust into every release.</h2>
              <p>Start verifying the artifacts your team builds, distributes, and deploys.</p>
            </div>
            <div className="lp-final-actions">
              <Button className="lp-primary-button" onClick={onRegister}>
                Get Started
              </Button>
              <Button className="lp-cta-secondary" variant="secondary" onClick={onLogin}>
                Sign In
              </Button>
            </div>
          </Card>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div>
            <strong>Tech Pulse</strong>
            <p>Software verification for technical teams.</p>
          </div>
          <div className="lp-footer-links">
            <a href="#product">Product</a>
            <a href="#how-it-works">How it works</a>
            <a href="#developers">Developers</a>
            <a href="#documentation">Documentation</a>
          </div>
          <div className="lp-footer-links">
            <span>Company</span>
            <span>About</span>
            <span>Contact</span>
          </div>
          <div className="lp-footer-links">
            <span>Legal</span>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
