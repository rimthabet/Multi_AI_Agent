package nasoft.ocr.models;

public class Dictionary {
	private String code;
	private String libelle;
	private String referentCode;
	private String referentLibelle;

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getLibelle() {
		return libelle;
	}

	public void setLibelle(String libelle) {
		this.libelle = libelle;
	}

	public String getReferentCode() {
		return referentCode;
	}

	public void setReferentCode(String referentCode) {
		this.referentCode = referentCode;
	}

	public String getReferentLibelle() {
		return referentLibelle;
	}

	public void setReferentLibelle(String referentLibelle) {
		this.referentLibelle = referentLibelle;
	}

	public Dictionary(String code, String libelle) {
		super();
		this.code = code;
		this.libelle = libelle;
	}

	public Dictionary(String code, String libelle, String referentCode, String referentLibelle) {
		super();
		this.code = code;
		this.libelle = libelle;
		this.referentCode = referentCode;
		this.referentLibelle = referentLibelle;
	}
}
