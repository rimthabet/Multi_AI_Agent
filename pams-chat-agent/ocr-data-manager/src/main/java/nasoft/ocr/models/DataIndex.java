package nasoft.ocr.models;

public class DataIndex {
	private String data;
	private int index;

	public DataIndex() {
		super();
	}

	public String getData() {
		return data;
	}

	public void setData(String data) {
		this.data = data;
	}

	public int getIndex() {
		return index;
	}

	public void setIndex(int index) {
		this.index = index;
	}

	public DataIndex(String data, int index) {
		super();
		this.data = data;
		this.index = index;
	}

}
