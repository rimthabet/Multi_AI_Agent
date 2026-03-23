package nasoft.ocr.models;

public class DateIndex {
	private String date;
	private int index;
	private int tableNum;
	private int rowSize;

	public DateIndex() {
		super();
	}

	public DateIndex(String date, int index, int rowSize,int tableNum) {
		this.date = date;
		this.index = index;
		this.rowSize=rowSize;
		this.tableNum = tableNum;
	}
	public DateIndex(String date, int index) {
		this.date = date;
		this.index = index;
	}

	public String getDate() {
		return date;
	}

	public void setDate(String date) {
		this.date = date;
	}

	public int getIndex() {
		return index;
	}

	public void setIndex(int index) {
		this.index = index;
	}

	public int getTableNum() {
		return tableNum;
	}

	public void setTableNum(int tableNum) {
		this.tableNum = tableNum;
	}

	public int getRowSize() {
		return rowSize;
	}

	public void setRowSize(int rowSize) {
		this.rowSize = rowSize;
	}

	
}
