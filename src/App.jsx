import { useEffect, useState, useRef } from "react";
import * as bootstrap from "bootstrap";

import axios from "axios";
import ProductModal from "./components/ProductModal";
import Pagination from "./components/Pagination";

const API_BASE = "https://ec-course-api.hexschool.io/v2";
const API_PATH = "tiffany871205";

const INITIAL_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
};

function App() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [templateProduct, setTemplateProduct] = useState(INITIAL_TEMPLATE_DATA);
  const [modalType, setModalType] = useState("");
  const [pagination, setPagination] = useState({});

  const productModalRef = useRef(null);

  // 資料改變處理
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // checkbox 資料改變處理
  const handleTemplateInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setTemplateProduct((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 多筆圖片網址處理
  const handleModalImageChange = (index, value) => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage[index] = value;
      return {
        ...pre,
        imagesUrl: newImage,
      };
    });
  };

  // 新增圖片
  const handleAddImage = () => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.push("");
      return {
        ...pre,
        imagesUrl: newImage,
      };
    });
  };

  // 移除圖片
  const handleRemoveImage = () => {
    setTemplateProduct((prevData) => {
      const newImages = [...prevData.imagesUrl];
      newImages.pop();
      return {
        ...prevData,
        imagesUrl: newImages,
      };
    });
  };

  //取得產品資料
  const getProducts = async (page = 1) => {
    try {
      const response = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products?page=${page}`);
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      console.log(error.response.data.message);
    }
  };

  //更新新增產品
  const updateProducts = async (id) => {
    let url = `${API_BASE}/api/${API_PATH}/admin/product`;
    let method = "post";
    if (modalType === "edit") {
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`;
      method = "put";
    }
    const productData = {
      data: {
        ...templateProduct,
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        is_enabled: templateProduct.is_enabled ? 1 : 0,
        imagesUrl: [...templateProduct.imagesUrl.filter((url) => url !== "")],
      },
    };

    try {
      const response = await axios[method](url, productData);
      console.log(response.data);
      getProducts();
      closeModal();
    } catch (error) {
      console.log(error.response);
    }
  };

  // 刪除產品
  const deleteProduct = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`);
      console.log(response.data);
      getProducts();
      closeModal();
    } catch (error) {
      console.log(error.response.data.message);
    }
  };

  //上傳圖片
  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file-to-upload", file);

      const response = await axios.post(`${API_BASE}/api/${API_PATH}/admin/upload`, formData);

      setTemplateProduct((pre) => ({
        ...pre,
        imageUrl: response.data.imageUrl,
      }));
    } catch (error) {
      console.log(error.response);
    }
  };

  //登入
  const onSubmit = async (e) => {
    try {
      e.preventDefault();
      const response = await axios.post(`${API_BASE}/admin/signin`, formData);
      const { token, expired } = response.data;
      document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
      axios.defaults.headers.common["Authorization"] = token;
      // console.log(response.data);

      getProducts();
      setIsAuth(true);
    } catch (error) {
      console.log(error.response);
    }
  };

  useEffect(() => {
    // cookie處理
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")[1];
    if (token) {
      axios.defaults.headers.common["Authorization"] = token;
    }

    // 初始化modal
    productModalRef.current = new bootstrap.Modal("#productModal", { keyboard: false });
    // modal關閉移除focus
    document.querySelector("#productModal").addEventListener("hide.bs.modal", () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
    // 檢查登入
    const checkLogin = async () => {
      try {
        const response = await axios.post(`${API_BASE}/api/user/check`);
        setIsAuth(true);
        getProducts();
      } catch (error) {
        console.log(error.response.data.message);
      }
    };

    checkLogin();
  }, []);

  // 打開 modal
  const openModal = (type, product) => {
    setModalType(type);
    setTemplateProduct((pre) => ({
      ...pre,
      ...product,
    }));
    productModalRef.current.show();
  };

  // 關閉 modal
  const closeModal = () => {
    productModalRef.current.hide();
  };

  return (
    <>
      {!isAuth ? (
        <div className="container login">
          <h1>請先登入</h1>
          <form className="form-floating" onSubmit={(e) => onSubmit(e)}>
            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                name="username"
                id="username"
                placeholder="name@product.com"
                value={formData.username}
                onChange={(e) => handleInputChange(e)}
              />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating">
              <input
                type="password"
                className="form-control"
                name="password"
                id="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => handleInputChange(e)}
              />
              <label htmlFor="password">Password</label>
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-2">
              登入
            </button>
          </form>
        </div>
      ) : (
        <div className="container">
          <div className="row mt-5">
            <h2>產品列表</h2>
            {/* 新增產品按鈕 */}
            <div className="text-end mt-4">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openModal("create", INITIAL_TEMPLATE_DATA)}
              >
                建立新的產品
              </button>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>分類</th>
                  <th>產品名稱</th>
                  <th>原價</th>
                  <th>售價</th>
                  <th>是否啟用</th>
                  <th>查看細節</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <tr key={item.id}>
                    <td>{item.category}</td>
                    <td>{item.title}</td>
                    <td>{item.origin_price}</td>
                    <td>{item.price}</td>
                    <td className={item.is_enabled ? "text-success" : "text-muted"}>
                      {item.is_enabled ? "啟用" : "未啟用"}
                    </td>
                    <td>
                      <div className="btn-group" role="group" aria-label="Basic product">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openModal("edit", item)}
                        >
                          編輯
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => openModal("delete", item)}
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination pagination={pagination} onChangePage={getProducts} />
          </div>
        </div>
      )}
      <ProductModal
        modalType={modalType}
        templateProduct={templateProduct}
        handleTemplateInputChange={handleTemplateInputChange}
        handleAddImage={handleAddImage}
        handleModalImageChange={handleModalImageChange}
        handleRemoveImage={handleRemoveImage}
        updateProducts={updateProducts}
        deleteProduct={deleteProduct}
        closeModal={closeModal}
        uploadImage={uploadImage}
        // 前面為ProductModal傳入的名稱
      />
    </>
  );
}

export default App;
